import React, { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, LayoutGrid, List, X, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { pb, isPocketBaseConfigured, normalizeTags, serializeTags } from './lib/pocketbase';
import { COLOR_PALETTE } from './lib/constants';
import { extractVariables, triggerHaptic } from './lib/utils';
import Login from './components/Login';
import LandingPage, { DEMO_CREDENTIALS } from './components/LandingPage';
import Header from './components/Header';
import CategoryMenu from './components/CategoryMenu';
import FilterBar from './components/FilterBar';
import PromptCard from './components/PromptCard';
import AdminModal from './components/AdminModal';
import SettingsModal from './components/SettingsModal';
import Modal from './components/Modal';
import PromptViewModal from './components/PromptViewModal';
import FilterSidebar from './components/FilterSidebar';
import AuthGuardModal from './components/AuthGuardModal';
import BottomNav from './components/BottomNav';
import VersionBadge from './components/VersionBadge';

// prompts/prompt_revisions salvano category/type/tags come relation (ID) su
// PocketBase, ma il resto dell'app ragiona per nomi (filtri, card, menu).
// normalizeRecord converte ID → nome usando i dati espansi in lettura;
// idFor fa il percorso inverso (nome → ID) prima di scrivere su PocketBase.
// Etichetta leggibile del creatore: nome se presente, altrimenti la parte
// locale dell'email (visibile solo se l'utente ha emailVisibility attivo).
// Restituisce '' quando il prompt non ha owner (record creati prima che il
// campo esistesse) così la UI può semplicemente non mostrare nulla.
const ownerLabel = (owner) => {
  if (!owner) return '';
  if (owner.name) return owner.name;
  if (owner.email) return owner.email.split('@')[0];
  return '';
};

const normalizeRecord = (record) => ({
  ...record,
  category: record.expand?.category?.name ?? record.category,
  type: record.expand?.type?.name ?? record.type,
  tags: normalizeTags(record.expand?.tags ?? record.tags),
  owner_name: ownerLabel(record.expand?.owner),
});

const idFor = (name, list) => list.find((item) => item.name === name)?.id ?? name;

// Etichette italiane delle tassonomie, usate dal modale di gestione.
const TAXONOMY_LABELS = {
  categories: { plural: 'Categorie', singular: 'Categoria' },
  types:      { plural: 'Tipologie', singular: 'Tipologia' },
  tags:       { plural: 'Tag',       singular: 'Tag' },
};

// ─── Nomi collection PocketBase ──────────────────────────────────────────────
const COLL = {
  prompts:    'prompts',
  categories: 'prompt_categ',
  types:      'prompt_types',
  tags:       'prompt_tags',
  revisions:  'prompt_revisions',
};

const normalizeSortBy = (value) => {
  if (!value) return 'created';
  if (value === 'created_at' || value === '@created') return 'created';
  if (value === 'updated_at' || value === '@updated') return 'updated';
  return ['created', 'updated', 'title'].includes(value) ? value : 'created';
};

const sortByLabel = (value) => {
  if (value === 'created') return 'Creazione';
  if (value === 'updated') return 'Modifica';
  return value;
};

function formatPbError(err) {
  if (!err) return 'Errore sconosciuto';
  const status = err.status ? `[HTTP ${err.status}] ` : '';
  if (err.data && typeof err.data === 'object') {
    const fields = Object.entries(err.data)
      .map(([k, v]) => `${k}: ${v?.message || JSON.stringify(v)}`)
      .join(' | ');
    if (fields) return `${status}${fields}`;
  }
  return `${status}${err.message || String(err)}`;
}

// ─── Helper fetch con log completi ───────────────────────────────────────────
const fetchCollection = async (name, opts) => {
  console.log(`[BOB] ▶ fetch "${name}"`, opts);
  try {
    const result = await pb.collection(name).getFullList(opts);
    console.log(`[BOB] ✅ "${name}" → ${result.length} record`);
    return result;
  } catch (e) {
    console.error(
      `[BOB] ❌ "${name}" HTTP ${e.status}`,
      '| message:', e.message,
      '| data:', JSON.stringify(e.data),
      '| url:', pb.baseUrl + `/api/collections/${name}/records`,
    );
    throw e;
  }
};

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [appState, setAppState] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // modalità iniziale della schermata Login

  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('bob_view_mode') || 'grid');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState(() => normalizeSortBy(localStorage.getItem('bob_sort_by')));
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('bob_sort_dir') || 'desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState('categories');
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState(false);
  const [revisions, setRevisions] = useState({});
  const [compileModal, setCompileModal] = useState({ isOpen: false, prompt: null, variables: [], inputs: {} });
  const [viewModal, setViewModal] = useState({ isOpen: false, prompt: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [persistentError, setPersistentError] = useState(null);

  const bootstrapDone = useRef(false);
  const searchInputRef = useRef(null);

  const fetchData = async (authenticated) => {
    const authFlag = authenticated !== undefined ? authenticated : isAuthenticated;
    try {
      setLoading(true);
      setPersistentError(null);
      const sortField = `${sortDir === 'asc' ? '+' : '-'}${sortBy}`;
      console.log(`[BOB] fetchData start — auth:${authFlag} sort:${sortField}`);

      const [promptsData, catData, typeData, tagData] = await Promise.all([
        fetchCollection(COLL.prompts,    { sort: sortField, expand: 'category,type,tags,owner' }),
        fetchCollection(COLL.categories, { sort: '+name' }),
        fetchCollection(COLL.types,      { sort: '+name' }),
        fetchCollection(COLL.tags,       { sort: '+name' }),
      ]);

      const sortByName = (arr) => [...(arr || [])].sort((a, b) => a.name.localeCompare(b.name, 'it'));
      setPrompts((promptsData || []).map(normalizeRecord));
      setCategories(sortByName(catData || []));
      setTypes(sortByName(typeData || []));
      setTags(sortByName(tagData || []));
      console.log(`[BOB] fetchData ✅ prompts:${promptsData.length} categ:${catData.length} types:${typeData.length} tags:${tagData.length}`);

      if (authFlag) {
        try {
          const revData = await fetchCollection(COLL.revisions, { sort: '-created', expand: 'category,type,tags' });
          const grouped = (revData || []).reduce((acc, rev) => {
            const key = rev.prompt_id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(normalizeRecord(rev));
            return acc;
          }, {});
          setRevisions(grouped);
        } catch (revErr) {
          console.warn('[BOB] prompt_revisions non disponibili:', formatPbError(revErr));
          setRevisions({});
        }
      } else {
        setRevisions({});
      }
    } catch (err) {
      console.error('[BOB] fetchData FAIL:', formatPbError(err));
      setPersistentError(formatPbError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bootstrapDone.current) return;
    bootstrapDone.current = true;

    async function bootstrap() {
      if (!isPocketBaseConfigured) {
        setAppState('not_configured');
        setLoading(false);
        return;
      }

      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
          setIsAuthenticated(true);
          setAppState('ready');
          fetchData(true);
          return;
        } catch (e) {
          console.warn('[BOB] auth-refresh fallito (HTTP', e.status, ') — sessione scaduta o utente non trovato');
          pb.authStore.clear();
          localStorage.removeItem('bob_pb_auth');
        }
      }

      setAppState('landing');
      setLoading(false);
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (appState !== 'ready' || !isPocketBaseConfigured) return;
    fetchData(isAuthenticated);
  }, [sortBy, sortDir]);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(s => ({ ...s, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  useEffect(() => { localStorage.setItem('bob_view_mode', viewMode); }, [viewMode]);

  const handleLogin = async (email, password) => {
    try {
      await pb.collection('users').authWithPassword(email, password);
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setAppState('ready');
      fetchData(true);
      return true;
    } catch { return false; }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    localStorage.removeItem('bob_pb_auth');
    setIsAuthenticated(false);
    setAppState('landing');
    triggerHaptic('light');
  };

  const handleDemoLogin = async () => {
    triggerHaptic('light');
    const ok = await handleLogin(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    if (!ok) {
      // L'account demo può essere stato rimosso o rinominato lato PocketBase:
      // in quel caso apriamo il login normale già compilato con l'email demo.
      setAuthMode('login');
      setAppState('auth');
    }
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAppState('auth');
  };

  const ensureAuth = (action) => {
    if (isAuthenticated) { action(); }
    else { triggerHaptic('warning'); setIsAuthGuardOpen(true); }
  };

  const handleCopy = (title) => {
    triggerHaptic('success');
    setToast({ show: true, message: `"${title}" copiato!`, type: 'success' });
  };

  const handleDelete = async (id) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        await pb.collection(COLL.prompts).delete(id);
        await fetchData(isAuthenticated);
        setToast({ show: true, message: 'Prompt eliminato', type: 'success' });
        triggerHaptic('warning');
      } catch (err) { setToast({ show: true, message: 'Errore eliminazione: ' + formatPbError(err), type: 'error' }); }
      finally { setIsSaving(false); }
      setIsModalOpen(false);
    });
  };

  const handleSave = async (formData, saveAsRevision = false) => {
    ensureAuth(async () => {
      // Payload esplicito: formData porta con sé campi di sola lettura
      // (expand, owner_name, created…) che non appartengono allo schema.
      const newPrompt = {
        title: formData.title,
        content: formData.content,
        category: idFor(formData.category, categories),
        type: idFor(formData.type, types),
        tags: serializeTags(formData.tags || []).map((name) => idFor(name, tags)),
      };
      try {
        setIsSaving(true);
        if (modalInitialData) {
          if (saveAsRevision) {
            await pb.collection(COLL.revisions).create({
              prompt_id: modalInitialData.id, title: modalInitialData.title,
              content: modalInitialData.content,
              category: idFor(modalInitialData.category, categories),
              type: idFor(modalInitialData.type, types),
              tags: serializeTags(modalInitialData.tags || []).map((name) => idFor(name, tags)),
            });
          }
          // owner non viene toccato in modifica: resta chi ha creato il prompt.
          await pb.collection(COLL.prompts).update(modalInitialData.id, newPrompt);
          setToast({ show: true, message: saveAsRevision ? 'Revisione salvata!' : 'Prompt aggiornato!', type: 'success' });
        } else {
          await pb.collection(COLL.prompts).create({
            ...newPrompt,
            is_favorite: false,
            owner: pb.authStore.model?.id,
          });
          setToast({ show: true, message: 'Nuovo prompt salvato!', type: 'success' });
        }
        await fetchData(isAuthenticated);
        setIsModalOpen(false);
      } catch (err) { setToast({ show: true, message: 'Errore: ' + formatPbError(err), type: 'error' }); }
      finally { setIsSaving(false); }
    });
  };

  const handleDuplicate = async (prompt) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        // La copia appartiene a chi la crea, non all'autore dell'originale.
        await pb.collection(COLL.prompts).create({
          title: `Copia di ${prompt.title}`,
          content: prompt.content,
          category: idFor(prompt.category, categories),
          type: idFor(prompt.type, types),
          tags: serializeTags(prompt.tags || []).map((name) => idFor(name, tags)),
          is_favorite: false,
          owner: pb.authStore.model?.id,
        });
        await fetchData(isAuthenticated);
        setToast({ show: true, message: `"${prompt.title}" duplicato!`, type: 'success' });
        triggerHaptic('success');
      } catch (err) { setToast({ show: true, message: 'Errore duplicazione: ' + formatPbError(err), type: 'error' }); }
      finally { setIsSaving(false); }
    });
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        await pb.collection(COLL.prompts).update(id, { is_favorite: !currentStatus });
        await fetchData(isAuthenticated);
        setToast({ show: true, message: !currentStatus ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', type: 'success' });
        triggerHaptic('light');
      } catch (err) { setToast({ show: true, message: 'Errore: ' + formatPbError(err), type: 'error' }); }
      finally { setIsSaving(false); }
    });
  };

  const handleExportPrompts = () => {
    try {
      triggerHaptic('success');
      const exportData = { version: "1.2.0", exported_at: new Date().toISOString(), prompts: filteredPrompts.map(p => ({ title: p.title, content: p.content, category: p.category, type: p.type, tags: p.tags, is_favorite: p.is_favorite })) };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bob-prompts-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      setToast({ show: true, message: `${filteredPrompts.length} prompt esportati!`, type: 'success' });
    } catch { setToast({ show: true, message: 'Errore esportazione', type: 'error' }); }
  };

  const handleOpenCompile = (prompt) => {
    const vars = extractVariables(prompt.content);
    if (vars.length > 0) { triggerHaptic('light'); setCompileModal({ isOpen: true, prompt, variables: vars, inputs: {} }); }
    else { navigator.clipboard.writeText(prompt.content); triggerHaptic('success'); handleCopy(prompt.title); }
  };

  const handleCompile = () => {
    if (!compileModal.prompt) return '';
    let content = compileModal.prompt.content;
    Object.entries(compileModal.inputs).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return content;
  };

  const getMetadataCollection = () =>
    settingsMode === 'categories' ? COLL.categories :
    settingsMode === 'types'      ? COLL.types :
    COLL.tags;

  const handleAddMetadata = async (item) => {
    try { setIsSaving(true); await pb.collection(getMetadataCollection()).create({ name: item.name, color: item.color }); await fetchData(isAuthenticated); setToast({ show: true, message: 'Aggiunto', type: 'success' }); }
    catch (err) { setToast({ show: true, message: 'Errore: ' + formatPbError(err), type: 'error' }); }
    finally { setIsSaving(false); }
  };
  const handleUpdateMetadata = async (id, item) => {
    try { setIsSaving(true); await pb.collection(getMetadataCollection()).update(id, { name: item.name, color: item.color }); await fetchData(isAuthenticated); setToast({ show: true, message: 'Aggiornato', type: 'success' }); }
    catch (err) { setToast({ show: true, message: 'Errore: ' + formatPbError(err), type: 'error' }); }
    finally { setIsSaving(false); }
  };
  const handleDeleteMetadata = async (id) => {
    const field = settingsMode === 'categories' ? 'category' : 'type';
    const itemName = (settingsMode === 'categories' ? categories : types).find(i => i.id === id)?.name;
    if (settingsMode !== 'tags') {
      const usedBy = prompts.filter(p => p[field] === itemName);
      if (usedBy.length > 0 && !window.confirm(`"${itemName}" è usata da ${usedBy.length} prompt. Continuare?`)) return;
    }
    try { setIsSaving(true); await pb.collection(getMetadataCollection()).delete(id); await fetchData(isAuthenticated); setToast({ show: true, message: 'Rimosso', type: 'success' }); }
    catch (err) { setToast({ show: true, message: 'Errore: ' + formatPbError(err), type: 'error' }); }
    finally { setIsSaving(false); }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = activeCategory === 'Tutti' || prompt.category === activeCategory;
    const matchesType = activeType === 'Tutti' || prompt.type === activeType;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => (prompt.tags || []).includes(tag));
    const matchesSearch = (prompt.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (prompt.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavorites || prompt.is_favorite;
    return matchesCategory && matchesType && matchesTags && matchesSearch && matchesFavorites;
  });

  if (appState === 'not_configured') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 px-6">
        <div className="max-w-md w-full bg-red-950 border border-red-700 rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Configurazione mancante</h1>
          <p className="text-red-300 text-sm leading-relaxed mb-4">
            La variabile <code className="bg-red-900 px-1.5 py-0.5 rounded font-mono text-red-200">VITE_POCKETBASE_URL</code> non è definita.
          </p>
          <p className="text-slate-400 text-xs">Imposta la variabile nel file <code className="font-mono">.env</code> e riavvia l'app.</p>
        </div>
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (appState === 'landing') {
    return (
      <LandingPage
        onLogin={() => openAuth('login')}
        onRegister={() => openAuth('register')}
        onDemo={handleDemoLogin}
      />
    );
  }

  if (appState === 'auth') {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setAppState('landing')}
        initialMode={authMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 sm:pb-10">
      <Header
        searchRef={searchInputRef} onSearch={setSearchQuery}
        onSettings={() => setIsFilterSidebarOpen(true)}
        userEmail={isAuthenticated ? (pb.authStore.model?.email || '') : ''}
        showFavorites={showFavorites}
        onToggleFavorites={() => { triggerHaptic('light'); setShowFavorites(!showFavorites); }}
        isLoggedIn={isAuthenticated}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onExport={handleExportPrompts}
      />

      {isSaving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Salvataggio...</span>
        </div>
      )}

      {persistentError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-lg
          bg-red-600 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 border border-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-200" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-red-200 mb-0.5">Errore di caricamento dati</p>
            <p className="text-sm font-medium break-words leading-snug">{persistentError}</p>
          </div>
          <button onClick={() => setPersistentError(null)} className="shrink-0 text-red-200 hover:text-white transition-colors mt-0.5" aria-label="Chiudi errore">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 space-y-6">
        <section>
          <CategoryMenu
            categories={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' } }, ...categories]}
            activeCategory={activeCategory} onSelectCategory={setActiveCategory}
          />
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                {activeCategory === 'Tutti' ? 'Tutti i Prompt' : activeCategory}
                <span className="text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{filteredPrompts.length}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {searchQuery ? `Risultati per "${searchQuery}"` : 'Esplora e usa i tuoi prompt migliori'}
              </p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => { const n = sortBy === 'created' ? 'updated' : 'created'; setSortBy(n); localStorage.setItem('bob_sort_by', n); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{sortByLabel(sortBy)}</span>
                </button>
                <button onClick={() => { const n = sortDir === 'desc' ? 'asc' : 'desc'; setSortDir(n); localStorage.setItem('bob_sort_dir', n); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all border-l border-slate-200 dark:border-slate-700">
                  {sortDir === 'desc' ? '↓ New' : '↑ Old'}
                </button>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => { triggerHaptic('light'); setViewMode('grid'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}><LayoutGrid className="w-4.5 h-4.5" /></button>
                <button onClick={() => { triggerHaptic('light'); setViewMode('list'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}><List className="w-4.5 h-4.5" /></button>
              </div>
            </div>
          </div>

          <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            {filteredPrompts.map(prompt => (
              <PromptCard key={prompt.id} prompt={prompt} categories={categories} types={types} viewMode={viewMode}
                onCopy={handleCopy}
                onEdit={(p) => ensureAuth(() => { setModalInitialData(p); setIsModalOpen(true); })}
                onToggleFavorite={handleToggleFavorite} onCompile={handleOpenCompile}
                onView={(p) => setViewModal({ isOpen: true, prompt: p })}
                onDelete={handleDelete} onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {filteredPrompts.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl w-24 h-24 flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700">
                <Loader2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nessun prompt trovato</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Prova a cambiare i filtri o la query di ricerca</p>
            </div>
          )}
        </section>
      </main>

      <div className="hidden sm:flex justify-center pb-6">
        <VersionBadge />
      </div>

      {isAuthenticated && (
        <button onClick={() => { setModalInitialData(null); setIsModalOpen(true); }}
          className="hidden sm:flex fixed bottom-6 right-6 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg items-center justify-center z-40 transition-transform active:scale-95">
          <Plus className="w-7 h-7" />
        </button>
      )}

      <BottomNav
        activeTab={searchQuery ? 'search' : 'filters'}
        onTabChange={(tab) => {
          if (tab === 'filters') setIsFilterSidebarOpen(true);
          if (tab === 'search') { triggerHaptic('light'); setTimeout(() => searchInputRef.current?.focus(), 100); }
        }}
        onNewPrompt={() => ensureAuth(() => { setModalInitialData(null); setIsModalOpen(true); })}
        showFavorites={showFavorites}
        onToggleFavorites={() => { triggerHaptic('light'); setShowFavorites(!showFavorites); }}
        isLoggedIn={isAuthenticated} onLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout}
      />

      <FilterSidebar
        isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)}
        categories={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' } }, ...categories]}
        activeCategory={activeCategory} onSelectCategory={(cat) => { setActiveCategory(cat); setIsFilterSidebarOpen(false); }}
        types={types} activeType={activeType} onSelectType={(type) => { setActiveType(type); setIsFilterSidebarOpen(false); }}
        tags={tags} selectedTags={selectedTags} onSelectTags={setSelectedTags}
        showFavorites={showFavorites} onToggleFavorites={() => setShowFavorites(!showFavorites)}
        onResetFilters={() => { setActiveCategory('Tutti'); setActiveType('Tutti'); setSelectedTags([]); setShowFavorites(false); setSearchQuery(''); setIsFilterSidebarOpen(false); }}
        isLoggedIn={isAuthenticated}
        onOpenSettings={(mode) => { setSettingsMode(mode); setIsFilterSidebarOpen(false); setIsSettingsOpen(true); }}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete}
        initialData={modalInitialData} categories={categories.map(c => c.name)} types={types.map(t => t.name)}
        promptTags={tags.map(t => t.name)} revisions={modalInitialData ? (revisions[modalInitialData.id] || []) : []} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        title={TAXONOMY_LABELS[settingsMode].plural} singular={TAXONOMY_LABELS[settingsMode].singular}
        items={settingsMode === 'categories' ? categories : settingsMode === 'types' ? types : tags}
        onAddItem={handleAddMetadata} onUpdateItem={handleUpdateMetadata} onDeleteItem={handleDeleteMetadata} />

      {compileModal.isOpen && (
        <Modal
          isOpen={compileModal.isOpen}
          onClose={() => setCompileModal({ ...compileModal, isOpen: false })}
          labelledBy="compile-title"
          overlayClassName="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          panelClassName="bg-white dark:bg-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden"
        >
            {/* Maniglia: segnala che è un pannello a comparsa, come nelle app native */}
            <div className="sm:hidden shrink-0 flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="shrink-0 px-5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Compila le variabili</p>
                <h3 id="compile-title" className="text-base sm:text-xl font-bold truncate">{compileModal.prompt.title}</h3>
              </div>
              <button
                onClick={() => setCompileModal({ ...compileModal, isOpen: false })}
                className="shrink-0 p-2 -mr-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo scorrevole: senza questo il contenuto eccedeva lo schermo e
                il pulsante di conferma restava irraggiungibile da mobile.
                overscroll-contain evita che lo scroll prosegua sulla pagina. */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
              {compileModal.variables.map((v, idx) => (
                <div key={v} className="space-y-1.5">
                  <label htmlFor={`var-${v}`} className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="font-mono text-violet-600 dark:text-violet-400">{`{{${v}}}`}</span>
                  </label>
                  <input
                    id={`var-${v}`}
                    type="text"
                    autoComplete="off"
                    autoFocus={idx === 0}
                    enterKeyHint={idx === compileModal.variables.length - 1 ? 'done' : 'next'}
                    placeholder={`Valore per ${v}`}
                    value={compileModal.inputs[v] ?? ''}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 outline-none transition-all text-slate-900 dark:text-slate-100"
                    onChange={(e) => setCompileModal({ ...compileModal, inputs: { ...compileModal.inputs, [v]: e.target.value } })}
                  />
                </div>
              ))}

              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4">
                <p className="text-slate-400 font-mono uppercase text-[10px] tracking-widest mb-2">Anteprima risultante</p>
                <div className="text-slate-200 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto overscroll-contain">{handleCompile()}</div>
              </div>
            </div>

            {/* Footer sempre visibile, con spazio per la home bar di iOS */}
            <div className="shrink-0 px-5 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => { triggerHaptic('success'); navigator.clipboard.writeText(handleCompile()); setCompileModal({ ...compileModal, isOpen: false }); setToast({ show: true, message: 'Prompt compilato e copiato!', type: 'success' }); }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-2xl transition-colors active:scale-[0.99]">Copia &amp; Chiudi</button>
            </div>
        </Modal>
      )}

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast.message}
        </div>
      )}

      {isLoginModalOpen && <Login onLogin={handleLogin} onClose={() => setIsLoginModalOpen(false)} />}

      <PromptViewModal isOpen={viewModal.isOpen} onClose={() => setViewModal({ isOpen: false, prompt: null })}
        prompt={viewModal.prompt} onCopy={handleCopy} onCompile={handleOpenCompile}
        onEdit={(p) => ensureAuth(() => { setModalInitialData(p); setIsModalOpen(true); })}
        onDelete={handleDelete} onDuplicate={handleDuplicate} onToggleFavorite={handleToggleFavorite} />

      <AuthGuardModal isOpen={isAuthGuardOpen} onClose={() => setIsAuthGuardOpen(false)} onLogin={() => setIsLoginModalOpen(true)} />
    </div>
  );
}
