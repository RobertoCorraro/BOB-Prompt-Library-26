import React, { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, LayoutGrid, List, X, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { pb, isPocketBaseConfigured, normalizeTags, serializeTags } from './lib/pocketbase';
import { COLOR_PALETTE } from './lib/constants';
import { extractVariables, triggerHaptic } from './lib/utils';
import Login from './components/Login';
import SetupWizard from './components/SetupWizard';
import Header from './components/Header';
import CategoryMenu from './components/CategoryMenu';
import FilterBar from './components/FilterBar';
import PromptCard from './components/PromptCard';
import AdminModal from './components/AdminModal';
import SettingsModal from './components/SettingsModal';
import VariableModal from './components/VariableModal';
import PromptViewModal from './components/PromptViewModal';
import FilterSidebar from './components/FilterSidebar';
import AuthGuardModal from './components/AuthGuardModal';
import BottomNav from './components/BottomNav';

const SETUP_DONE_KEY = 'bob_setup_done';
const normalizeRecord = (record) => ({ ...record, tags: normalizeTags(record.tags) });

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
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('bob_view_mode') || 'grid');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('bob_sort_by') || 'created');
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

  // ─ fetchData: query pubbliche + revisioni isolate ────────────
  const fetchData = async (authenticated) => {
    const authFlag = authenticated !== undefined ? authenticated : isAuthenticated;
    try {
      setLoading(true);
      setPersistentError(null);
      const sortField = `${sortDir === 'asc' ? '+' : '-'}${sortBy}`;

      // Blocco 1: collection pubbliche
      const [promptsData, catData, typeData, tagData] = await Promise.all([
        pb.collection('prompts').getFullList({ sort: sortField }),
        pb.collection('categories').getFullList({ sort: '+name' }),
        pb.collection('types').getFullList({ sort: '+name' }),
        pb.collection('prompt_tags').getFullList({ sort: '+name' }),
      ]);

      const sortByName = (arr) => [...(arr || [])].sort((a, b) => a.name.localeCompare(b.name, 'it'));
      setPrompts((promptsData || []).map(normalizeRecord));
      setCategories(sortByName(catData || []));
      setTypes(sortByName(typeData || []));
      setTags(sortByName(tagData || []));

      // Blocco 2: revisioni (solo se autenticato, isolate)
      if (authFlag) {
        try {
          const revData = await pb.collection('prompt_revisions').getFullList({ sort: '-created' });
          const grouped = (revData || []).reduce((acc, rev) => {
            const key = rev.prompt_id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(normalizeRecord(rev));
            return acc;
          }, {});
          setRevisions(grouped);
        } catch (revErr) {
          console.warn('prompt_revisions non disponibili:', formatPbError(revErr));
          setRevisions({});
        }
      } else {
        setRevisions({});
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setPersistentError(formatPbError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─ Bootstrap (eseguito una sola volta) ─────────────────────
  useEffect(() => {
    if (bootstrapDone.current) return;
    bootstrapDone.current = true;

    async function bootstrap() {
      if (!isPocketBaseConfigured) {
        setAppState('not_configured');
        setLoading(false);
        return;
      }
      const setupDone = localStorage.getItem(SETUP_DONE_KEY) === 'true';
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
          setIsAuthenticated(true);
          setAppState('ready');
          fetchData(true);
          return;
        } catch {
          pb.authStore.clear();
          localStorage.removeItem('bob_pb_auth');
        }
      }
      if (!setupDone) {
        setAppState('setup');
        setLoading(false);
        return;
      }
      setAppState('ready');
      fetchData(false);
    }
    bootstrap();
  }, []);

  // ─ Re-fetch al cambio sort (solo se app è ready) ────────────
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
      fetchData(true);
      return true;
    } catch { return false; }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    localStorage.removeItem('bob_pb_auth');
    setIsAuthenticated(false);
    fetchData(false);
    triggerHaptic('light');
  };

  const handleSetupComplete = () => {
    localStorage.setItem(SETUP_DONE_KEY, 'true');
    setIsAuthenticated(true);
    setAppState('ready');
    fetchData(true);
  };

  const handleSetupGoToLogin = () => {
    localStorage.setItem(SETUP_DONE_KEY, 'true');
    setAppState('ready');
    fetchData(false);
    setIsLoginModalOpen(true);
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
        await pb.collection('prompts').delete(id);
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
      const newPrompt = { ...formData, tags: serializeTags(formData.tags || []), updated_at: new Date().toISOString() };
      try {
        setIsSaving(true);
        if (modalInitialData) {
          if (saveAsRevision) {
            await pb.collection('prompt_revisions').create({
              prompt_id: modalInitialData.id, title: modalInitialData.title,
              content: modalInitialData.content, category: modalInitialData.category,
              type: modalInitialData.type, tags: serializeTags(modalInitialData.tags || []),
            });
          }
          await pb.collection('prompts').update(modalInitialData.id, newPrompt);
          setToast({ show: true, message: saveAsRevision ? 'Revisione salvata!' : 'Prompt aggiornato!', type: 'success' });
        } else {
          await pb.collection('prompts').create({ ...newPrompt, is_favorite: false });
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
        const { id, created, updated, ...rest } = prompt;
        await pb.collection('prompts').create({ ...rest, title: `Copia di ${prompt.title}`, tags: serializeTags(prompt.tags || []), is_favorite: false, updated_at: new Date().toISOString() });
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
        await pb.collection('prompts').update(id, { is_favorite: !currentStatus });
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
      const exportData = { version: "1.1.1", exported_at: new Date().toISOString(), prompts: filteredPrompts.map(p => ({ title: p.title, content: p.content, category: p.category, type: p.type, tags: p.tags, is_favorite: p.is_favorite })) };
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

  const getMetadataCollection = () => settingsMode === 'categories' ? 'categories' : settingsMode === 'types' ? 'types' : 'prompt_tags';

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
            L'applicazione non può avviarsi senza una connessione al database.
          </p>
          <p className="text-slate-400 text-xs">Imposta la variabile nel file <code className="font-mono">.env</code> e riavvia l'app.</p>
        </div>
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (appState === 'setup') {
    return <SetupWizard onSetupComplete={handleSetupComplete} onGoToLogin={handleSetupGoToLogin} />;
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
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-sky-600 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg animate-pulse">
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

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
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
                  <span className="hidden lg:inline">{sortBy === 'created' ? 'Creazione' : 'Modifica'}</span>
                </button>
                <button onClick={() => { const n = sortDir === 'desc' ? 'asc' : 'desc'; setSortDir(n); localStorage.setItem('bob_sort_dir', n); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all border-l border-slate-200 dark:border-slate-700">
                  {sortDir === 'desc' ? '↓ New' : '↑ Old'}
                </button>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => { triggerHaptic('light'); setViewMode('grid'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4.5 h-4.5" /></button>
                <button onClick={() => { triggerHaptic('light'); setViewMode('list'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4.5 h-4.5" /></button>
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

      {isAuthenticated && (
        <button onClick={() => { setModalInitialData(null); setIsModalOpen(true); }}
          className="hidden sm:flex fixed bottom-6 right-6 w-14 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg items-center justify-center z-40 transition-transform active:scale-95">
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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title={settingsMode}
        items={settingsMode === 'categories' ? categories : settingsMode === 'types' ? types : tags}
        onAddItem={handleAddMetadata} onUpdateItem={handleUpdateMetadata} onDeleteItem={handleDeleteMetadata} />

      {compileModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">{compileModal.prompt.title}</h3>
              <button onClick={() => setCompileModal({ ...compileModal, isOpen: false })}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {compileModal.variables.map(v => (
                <div key={v} className="space-y-1">
                  <label className="text-sm font-bold">{v}</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2"
                    onChange={(e) => setCompileModal({ ...compileModal, inputs: { ...compileModal.inputs, [v]: e.target.value } })} />
                </div>
              ))}
              <div className="bg-slate-900 rounded-xl p-4 mt-6">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono uppercase text-[10px] mb-2">Anteprima Risultante</pre>
                <div className="text-slate-200 whitespace-pre-wrap">{handleCompile()}</div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t">
              <button onClick={() => { triggerHaptic('success'); navigator.clipboard.writeText(handleCompile()); setCompileModal({ ...compileModal, isOpen: false }); setToast({ show: true, message: 'Prompt compilato e copiato!', type: 'success' }); }}
                className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl">Copia &amp; Chiudi</button>
            </div>
          </div>
        </div>
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
