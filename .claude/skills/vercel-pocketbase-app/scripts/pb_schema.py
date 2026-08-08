#!/usr/bin/env python3
"""
Gestione dello schema PocketBase: crearlo da una specifica leggibile, esportarlo
per versionarlo, ricrearlo altrove.

    pb_schema.py apply   <spec.json>  --url ... --email ... --password ...
    pb_schema.py dump    <out.json>   --url ... --email ... --password ...
    pb_schema.py restore <dump.json>  --url ... --email ... --password ...

`apply` accetta una specifica compatta e si occupa dei dettagli che è facile
sbagliare a mano:

  - aggiunge sempre i campi autodate `created` e `updated`, la cui assenza fa
    fallire con HTTP 400 qualunque query ordinata per data;
  - imposta `maxSelect` sulle relation multiple (con 0 PocketBase ne salva una
    sola, in silenzio);
  - risolve i riferimenti fra collection per nome, creandole nell'ordine giusto.

È idempotente: rilanciarlo su uno schema già applicato aggiunge solo ciò che
manca, senza toccare i dati.

Esempio di specifica:

{
  "collections": [
    {"name": "categorie", "rules": "auth", "fields": [
      {"name": "nome", "type": "text", "required": true},
      {"name": "colore", "type": "json"}
    ]},
    {"name": "articoli", "rules": "auth", "fields": [
      {"name": "titolo", "type": "text", "required": true},
      {"name": "corpo", "type": "editor"},
      {"name": "pubblicato", "type": "bool"},
      {"name": "categoria", "type": "relation", "collection": "categorie"},
      {"name": "tag", "type": "relation", "collection": "tag", "multiple": true},
      {"name": "owner", "type": "relation", "collection": "users"},
      {"name": "copertina", "type": "file", "maxSelect": 1}
    ]}
  ]
}

Scorciatoie per `rules`:
  "auth"    tutte le operazioni richiedono un utente autenticato (libreria condivisa)
  "owner"   lettura a tutti gli autenticati, modifica ed eliminazione al solo proprietario
            (richiede un campo relation chiamato `owner` verso users)
  "public"  lettura libera, scrittura ai soli autenticati
  oppure un oggetto esplicito: {"listRule": "...", "createRule": "...", ...}
"""
import argparse, json, random, ssl, sys, urllib.request, urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

REGOLE = {
    "auth":   dict.fromkeys(("listRule", "viewRule", "createRule", "updateRule", "deleteRule"),
                            "@request.auth.id != ''"),
    "public": {"listRule": "", "viewRule": "",
               "createRule": "@request.auth.id != ''",
               "updateRule": "@request.auth.id != ''",
               "deleteRule": "@request.auth.id != ''"},
    "owner":  {"listRule": "@request.auth.id != ''", "viewRule": "@request.auth.id != ''",
               "createRule": "@request.auth.id != ''",
               "updateRule": "@request.auth.id = owner",
               "deleteRule": "@request.auth.id = owner"},
}


class PB:
    def __init__(self, url, email, password):
        self.base = url.rstrip("/")
        r = self._req("POST", "/api/collections/_superusers/auth-with-password",
                      {"identity": email, "password": password}, auth=False)
        self.token = r.get("token")
        if not self.token:
            sys.exit(f"Login superuser fallito: {r}")

    def _req(self, method, path, body=None, auth=True):
        data = json.dumps(body).encode() if body is not None else None
        h = {"Content-Type": "application/json"}
        if auth:
            h["Authorization"] = self.token
        req = urllib.request.Request(self.base + path, data=data, method=method, headers=h)
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                return json.loads(resp.read() or b"{}")
        except urllib.error.HTTPError as e:
            return {"__errore__": e.code, **json.loads(e.read() or b"{}")}

    def collections(self):
        return {c["name"]: c for c in self._req("GET", "/api/collections?perPage=200").get("items", [])}


def _id(prefix):
    return f"{prefix}{random.randint(1000000000, 9999999999)}"


def autodate(nome, on_update):
    return {"id": _id("autodate"), "name": nome, "type": "autodate",
            "onCreate": True, "onUpdate": on_update,
            "hidden": False, "presentable": False, "system": False}


def costruisci_campo(spec, per_nome):
    """Traduce un campo della specifica compatta nel formato atteso da PocketBase."""
    t = spec.get("type", "text")
    base = {"id": _id(t), "name": spec["name"], "type": t,
            "required": bool(spec.get("required", False)),
            "hidden": False, "presentable": False, "system": False}

    if t in ("text", "editor"):
        base.update({"min": 0, "max": 0} if t == "text" else {"maxSize": 0})
        if t == "text":
            base.update({"pattern": "", "autogeneratePattern": "", "primaryKey": False})
        else:
            base["convertURLs"] = False
    elif t == "relation":
        target = spec.get("collection")
        if target not in per_nome:
            sys.exit(f"Il campo '{spec['name']}' punta a '{target}', che non esiste "
                     f"e non è nella specifica. Collection disponibili: {sorted(per_nome)}")
        # maxSelect 0 verrebbe trattato come selezione singola e perderebbe i valori
        # in eccesso senza segnalarlo: per le relazioni multiple serve un massimo esplicito.
        base.update({"collectionId": per_nome[target]["id"],
                     "cascadeDelete": bool(spec.get("cascadeDelete", False)),
                     "minSelect": 0,
                     "maxSelect": int(spec.get("maxSelect", 20 if spec.get("multiple") else 1))})
    elif t == "file":
        base.update({"maxSelect": int(spec.get("maxSelect", 1)), "maxSize": spec.get("maxSize", 5242880),
                     "mimeTypes": spec.get("mimeTypes", []), "thumbs": [], "protected": False})
    elif t == "number":
        base.update({"min": None, "max": None, "onlyInt": bool(spec.get("onlyInt", False))})
    elif t == "select":
        base.update({"values": spec.get("values", []), "maxSelect": int(spec.get("maxSelect", 1))})
    elif t == "date":
        base.update({"min": "", "max": ""})
    # bool e json non richiedono opzioni aggiuntive
    return base


def cmd_apply(pb, spec_path):
    spec = json.load(open(spec_path))
    esistenti = pb.collections()

    # Le collection referenziate vanno create prima di chi le referenzia.
    da_creare = spec["collections"]
    ordinate, rimaste, giri = [], list(da_creare), 0
    noti = set(esistenti)
    while rimaste and giri < len(da_creare) + 2:
        giri += 1
        for c in list(rimaste):
            dip = {f.get("collection") for f in c.get("fields", []) if f.get("type") == "relation"}
            if dip <= noti | {c["name"]}:
                ordinate.append(c); rimaste.remove(c); noti.add(c["name"])
    if rimaste:
        sys.exit(f"Riferimenti circolari o irrisolvibili fra: {[c['name'] for c in rimaste]}")

    for c in ordinate:
        nome = c["name"]
        regole = c.get("rules", "auth")
        regole = REGOLE.get(regole, regole) if isinstance(regole, str) else regole

        esistenti = pb.collections()  # rileggi: le relation hanno bisogno degli id appena creati
        campi = [costruisci_campo(f, esistenti) for f in c.get("fields", [])]
        campi += [autodate("created", False), autodate("updated", True)]

        if nome in esistenti:
            attuale = esistenti[nome]
            presenti = {f["name"] for f in attuale["fields"]}
            mancanti = [f for f in campi if f["name"] not in presenti]
            if mancanti:
                r = pb._req("PATCH", f"/api/collections/{nome}",
                            {"fields": attuale["fields"] + mancanti})
                stato = "errore: " + json.dumps(r)[:150] if "__errore__" in r else \
                        "aggiunti " + ", ".join(f["name"] for f in mancanti)
            else:
                stato = "già allineata"
            print(f"  {nome}: {stato}")
        else:
            r = pb._req("POST", "/api/collections", {"name": nome, "type": "base",
                                                     "fields": campi, **regole})
            print(f"  {nome}: {'ERRORE ' + json.dumps(r)[:200] if '__errore__' in r else 'creata'}")


def cmd_dump(pb, out):
    coll = [c for c in pb._req("GET", "/api/collections?perPage=200")["items"]
            if not c["name"].startswith("_")]
    json.dump(coll, open(out, "w"), indent=2, ensure_ascii=False)
    print(f"  {len(coll)} collection esportate in {out}")
    print("  Versionalo nel repo: è l'unica copia dello schema fuori dal volume Docker.")


def cmd_restore(pb, path):
    coll = json.load(open(path))
    r = pb._req("PUT", "/api/collections/import", {"collections": coll, "deleteMissing": False})
    print("  errore: " + json.dumps(r)[:300] if "__errore__" in r else f"  {len(coll)} collection importate")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Schema PocketBase: crea, esporta, ripristina")
    p.add_argument("comando", choices=["apply", "dump", "restore"])
    p.add_argument("file")
    p.add_argument("--url", required=True)
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    a = p.parse_args()

    pb = PB(a.url, a.email, a.password)
    {"apply": cmd_apply, "dump": cmd_dump, "restore": cmd_restore}[a.comando](pb, a.file)
