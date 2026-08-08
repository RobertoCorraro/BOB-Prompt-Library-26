#!/usr/bin/env bash
# Smoke test end-to-end di un'istanza PocketBase: raggiungibilità, autenticazione,
# ciclo CRUD completo, registrazione/login di un utente normale, regole di accesso
# e CORS dall'origine del frontend.
#
# Uso:
#   ./pb_smoke_test.sh https://pb.esempio.it admin@esempio.it 'password' [collection] [origin]
#
# Ogni record creato viene eliminato alla fine: lo script è pensato per girare
# anche contro un'istanza che contiene dati veri, senza lasciare rifiuti.

set -uo pipefail

BASE="${1:?URL PocketBase mancante, es: https://pb.esempio.it}"
SU_EMAIL="${2:?email superuser mancante}"
SU_PASS="${3:?password superuser mancante}"
COLLECTION="${4:-}"
ORIGIN="${5:-}"

BASE="${BASE%/}"
PASS=0; FAIL=0; SKIP=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
ko()   { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
skip() { printf '  \033[33m–\033[0m %s\n' "$1"; SKIP=$((SKIP+1)); }
head() { printf '\n\033[1m%s\033[0m\n' "$1"; }

jqp() { python3 -c "import json,sys;d=json.load(sys.stdin);print($1)" 2>/dev/null; }

# ─────────────────────────────────────────────────────────────────────────────
head "1. Raggiungibilità"

HEALTH=$(curl -sk -m 10 "$BASE/api/health")
if echo "$HEALTH" | grep -q '"code":200'; then
  ok "/api/health risponde 200"
else
  ko "/api/health non sano: $HEALTH"
  echo
  echo "  Diagnosi rapida del 404:"
  echo "    • '404 page not found' in testo semplice  -> è Traefik: nessuna rotta per questo host"
  echo "    • {\"...\":\"File not found\",\"status\":404} -> è PocketBase: raggiunto, normale sulla root"
  exit 1
fi

ROOT=$(curl -sk -m 10 "$BASE/")
if echo "$ROOT" | grep -q '"status":404'; then
  ok "root serve il 404 JSON di PocketBase (normale: pb_public è vuota)"
elif echo "$ROOT" | grep -qi '404 page not found'; then
  ko "root risponde col 404 di Traefik: la regola Host() non corrisponde"
fi

TLS=$(curl -s -o /dev/null -w '%{ssl_verify_result}' -m 10 "$BASE/api/health")
[ "$TLS" = "0" ] && ok "certificato TLS valido" || ko "TLS non verificato (codice $TLS)"

# ─────────────────────────────────────────────────────────────────────────────
head "2. Autenticazione superuser"

AUTH=$(curl -sk -m 10 -X POST "$BASE/api/collections/_superusers/auth-with-password" \
  -H 'Content-Type: application/json' \
  -d "$(python3 -c "import json,sys;print(json.dumps({'identity':sys.argv[1],'password':sys.argv[2]}))" "$SU_EMAIL" "$SU_PASS")")
TOKEN=$(echo "$AUTH" | jqp "d.get('token','')")

if [ -n "$TOKEN" ]; then ok "login superuser riuscito"; else ko "login superuser fallito: $AUTH"; exit 1; fi
AUTHH=(-H "Authorization: $TOKEN")

# ─────────────────────────────────────────────────────────────────────────────
head "3. Schema"

COLLS=$(curl -sk -m 10 "$BASE/api/collections?perPage=200" "${AUTHH[@]}")
NAMES=$(echo "$COLLS" | jqp "' '.join(c['name'] for c in d['items'] if not c['name'].startswith('_'))")
ok "collection applicative: ${NAMES:-(nessuna)}"

# Le trappole più comuni, verificate campo per campo.
AUDIT=$(cat <<'PY'
import json,sys
d=json.loads(sys.argv[1])
problemi=[]
for c in d['items']:
    if c['name'].startswith('_') or c['name']=='users': continue
    campi={f['name']:f for f in c.get('fields',[])}
    if 'created' not in campi or 'updated' not in campi:
        problemi.append(f"{c['name']}: mancano created/updated -> ?sort=-created darà HTTP 400")
    for f in c.get('fields',[]):
        if f['type']=='relation' and f.get('maxSelect')==0:
            problemi.append(f"{c['name']}.{f['name']}: relation con maxSelect=0 -> salva UN SOLO id, gli altri vengono persi")
for p in problemi: print(f"  \033[31m✗\033[0m {p}")
if not problemi: print("  \033[32m✓\033[0m nessuna trappola di schema rilevata (created/updated presenti, relation multiple corrette)")
PY
)
python3 -c "$AUDIT" "$COLLS"

# ─────────────────────────────────────────────────────────────────────────────
head "4. Ciclo CRUD"

if [ -z "$COLLECTION" ]; then
  COLLECTION=$(echo "$COLLS" | jqp "next((c['name'] for c in d['items'] if not c['name'].startswith('_') and c['name']!='users'), '')")
fi

if [ -z "$COLLECTION" ]; then
  skip "nessuna collection su cui testare il CRUD"
else
  echo "  collection sotto test: $COLLECTION"

  # Costruisce un payload minimo dai campi text obbligatori.
  PAYLOAD=$(curl -sk -m 10 "$BASE/api/collections/$COLLECTION" "${AUTHH[@]}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
p={}
for f in d.get('fields',[]):
    if f.get('system') or f['name'] in ('id','created','updated'): continue
    if f['type'] in ('text','editor') and f.get('required'): p[f['name']]='ZZ-smoke-test'
if not p: p={'name':'ZZ-smoke-test'}
print(json.dumps(p))")

  CREATED=$(curl -sk -m 10 -X POST "$BASE/api/collections/$COLLECTION/records" \
    "${AUTHH[@]}" -H 'Content-Type: application/json' -d "$PAYLOAD")
  ID=$(echo "$CREATED" | jqp "d.get('id','')")
  [ -n "$ID" ] && ok "CREATE riuscita (id $ID)" || ko "CREATE fallita: $CREATED"

  if [ -n "$ID" ]; then
    READ=$(curl -sk -m 10 "$BASE/api/collections/$COLLECTION/records/$ID" "${AUTHH[@]}")
    echo "$READ" | grep -q "\"id\":\"$ID\"" && ok "READ del singolo record" || ko "READ fallita"

    SORTED=$(curl -sk -m 10 -o /dev/null -w '%{http_code}' "$BASE/api/collections/$COLLECTION/records?sort=-created" "${AUTHH[@]}")
    [ "$SORTED" = "200" ] && ok "LIST con sort=-created (200)" \
      || ko "LIST con sort=-created -> HTTP $SORTED (di solito: manca il campo autodate 'created')"

    UPD=$(curl -sk -m 10 -X PATCH "$BASE/api/collections/$COLLECTION/records/$ID" \
      "${AUTHH[@]}" -H 'Content-Type: application/json' -d '{}' -o /dev/null -w '%{http_code}')
    [ "$UPD" = "200" ] && ok "UPDATE riuscita" || ko "UPDATE -> HTTP $UPD"

    DEL=$(curl -sk -m 10 -X DELETE "$BASE/api/collections/$COLLECTION/records/$ID" "${AUTHH[@]}" -o /dev/null -w '%{http_code}')
    [ "$DEL" = "204" ] && ok "DELETE riuscita (record di test rimosso)" || ko "DELETE -> HTTP $DEL — ATTENZIONE: record $ID rimasto"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
head "5. Registrazione e login utente"

TESTMAIL="zz-smoke-$(date +%s)@example.com"
TESTPASS="smokeTest12345"
REG=$(curl -sk -m 10 -X POST "$BASE/api/collections/users/records" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TESTMAIL\",\"password\":\"$TESTPASS\",\"passwordConfirm\":\"$TESTPASS\"}")
TESTUID=$(echo "$REG" | jqp "d.get('id','')")

if [ -n "$TESTUID" ]; then
  ok "registrazione pubblica aperta (users.createRule permissiva)"
  ULOGIN=$(curl -sk -m 10 -X POST "$BASE/api/collections/users/auth-with-password" \
    -H 'Content-Type: application/json' \
    -d "{\"identity\":\"$TESTMAIL\",\"password\":\"$TESTPASS\"}")
  UTOK=$(echo "$ULOGIN" | jqp "d.get('token','')")
  if [ -n "$UTOK" ]; then
    ok "login utente riuscito senza verifica email (authRule vuota)"
    if [ -n "$COLLECTION" ]; then
      N=$(curl -sk -m 10 "$BASE/api/collections/$COLLECTION/records" -H "Authorization: $UTOK" | jqp "d.get('totalItems','?')")
      ok "un utente autenticato legge $COLLECTION: $N record"
    fi
  else
    ko "login utente fallito: se authRule richiede verified=true serve l'SMTP configurato"
  fi
  DELU=$(curl -sk -m 10 -X DELETE "$BASE/api/collections/users/records/$TESTUID" "${AUTHH[@]}" -o /dev/null -w "%{http_code}")
  [ "$DELU" = "204" ] && ok "utente di test eliminato" || ko "utente di test $TESTUID NON eliminato (HTTP $DELU) — rimuovilo a mano"
else
  skip "registrazione pubblica chiusa o rifiutata: $(echo "$REG" | head -c 160)"
fi

# ─────────────────────────────────────────────────────────────────────────────
head "6. Regole di accesso viste da un anonimo"

if [ -n "$COLLECTION" ]; then
  ANON=$(curl -sk -m 10 "$BASE/api/collections/$COLLECTION/records")
  ATOT=$(echo "$ANON" | jqp "d.get('totalItems','?')")
  if [ "$ATOT" = "0" ]; then
    ok "senza login la lista è vuota (le list rule filtrano, non danno 403)"
    echo "     -> una eventuale 'modalità ospite' mostrerebbe un'app deserta"
  elif [ "$ATOT" = "?" ]; then
    ok "senza login l'accesso è negato: $(echo "$ANON" | head -c 90)"
  else
    ok "ATTENZIONE: $ATOT record leggibili pubblicamente da chiunque"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
head "7. SMTP (recupero password)"

SMTP=$(curl -sk -m 10 "$BASE/api/settings" "${AUTHH[@]}" | jqp "d.get('smtp',{}).get('enabled')")
if [ "$SMTP" = "True" ]; then
  ok "SMTP attivo: il reset password invia davvero l'email"
else
  ok "SMTP NON configurato -> requestPasswordReset risponde ok ma nessuna email parte"
  echo "     -> nel frontend mostra un avviso esplicito invece di 'controlla la tua email'"
fi

# ─────────────────────────────────────────────────────────────────────────────
head "8. CORS dall'origine del frontend"

if [ -n "$ORIGIN" ]; then
  CORS=$(curl -sk -m 10 -X OPTIONS "$BASE/api/collections/users/auth-with-password" \
    -H "Origin: $ORIGIN" -H 'Access-Control-Request-Method: POST' \
    -H 'Access-Control-Request-Headers: content-type' -D - -o /dev/null)
  echo "$CORS" | grep -qi 'access-control-allow-origin' \
    && ok "preflight ok da $ORIGIN" \
    || ko "nessun header CORS: il browser bloccherà le chiamate da $ORIGIN"
else
  skip "origine frontend non fornita (5° argomento) — CORS non verificato"
fi

# ─────────────────────────────────────────────────────────────────────────────
printf '\n\033[1mRisultato:\033[0m %d ok, %d falliti, %d saltati\n' "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ]
