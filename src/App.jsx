import React, { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, LayoutGrid, List, X, Braces, RefreshCw, Copy, ArrowUpDown } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AUTH_CONFIG } from './auth.config';
import { COLOR_PALETTE, DEFAULT_COLOR } from './lib/constants';
import { extractVariables, triggerHaptic } from './lib/utils';
import Login from './components/Login';
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

// Mock data for when Supabase is not connected
const MOCK_CATEGORIES = [
  { id: '3', name: 'Business', color: COLOR_PALETTE[6] },      // Blue
  { id: '5', name: 'Coding', color: COLOR_PALETTE[9] },        // Pink
  { id: '4', name: 'Copywriting', color: COLOR_PALETTE[3] },   // Green
  { id: '2', name: 'Marketing', color: COLOR_PALETTE[0] },     // Red
  { id: '1', name: 'Psicologia', color: COLOR_PALETTE[8] },    // Sky Blue
];

const MOCK_TYPES = [
  { id: '4', name: 'Esempio one-shot', color: COLOR_PALETTE[1] }, // Orange
  { id: '1', name: 'Prompt parziale', color: COLOR_PALETTE[5] },  // Cyan
  { id: '2', name: 'Prompt template', color: COLOR_PALETTE[2] },  // Amber
  { id: '3', name: 'System Prompt', color: COLOR_PALETTE[7] },    // Indigo
];

const MOCK_TAGS = [
  { id: '3', name: 'Email', color: COLOR_PALETTE[2] },         // Amber
  { id: '4', name: 'Productivity', color: COLOR_PALETTE[6] },  // Blue
  { id: '1', name: 'SEO', color: COLOR_PALETTE[4] },           // Emerald
  { id: '2', name: 'Social Media', color: COLOR_PALETTE[9] },  // Pink
];

const MOCK_PROMPTS = [
  {
    id: '1',
    title: 'Analisi transazionale',
    content: "Agisci come un esperto di analisi transazionale. Analizza il seguente dialogo identificando gli stati dell'io attivati:\n\n{{dialogo}}",
    category: 'Psicologia',
    type: 'Prompt template',
    tags: ['Psicologia', 'Analisi'],
    is_favorite: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Generatore di Headline',
    content: "Scrivi 5 headline persuasive per un prodotto che aiuta a {{beneficio_principale}}. Target: {{target_audience}}.",
    category: 'Copywriting',
    type: 'Prompt parziale',
    tags: ['Copywriting', 'SEO'],
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export default function App() {
  const [session, setSession] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('bob_authenticated') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // UI State
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('bob_view_mode') || 'grid';
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('bob_sort_by') || 'created_at');
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('bob_sort_dir') || 'desc');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Settings State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState('categories');
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState(false);

  // Revisions State (Mock)
  const [revisions, setRevisions] = useState({});

  // Compilation State
  const [compileModal, setCompileModal] = useState({
    isOpen: false,
    prompt: null,
    variables: [],
    inputs: {}
  });

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    prompt: null
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    localStorage.setItem('bob_view_mode', viewMode);
  }, [viewMode]);

  // NOTE: We intentionally do NOT persist data to localStorage.
  // Supabase is the single source of truth. Local admin changes persist
  // via Supabase. Guest users work with in-memory mock data that resets on reload.

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadMockData();
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        fetchData(); // Always fetch data
      })
      .catch(error => {
        console.error('Auth check failed:', error);
        loadMockData();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchData(); // Always fetch data
    });

    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch data whenever sort preferences change
  useEffect(() => {
    fetchData();
  }, [sortBy, sortDir]);

  // Loads static mock data for guests (no localStorage, in-memory only).
  const loadMockData = () => {
    setPrompts(MOCK_PROMPTS);
    setCategories(MOCK_CATEGORIES);
    setTypes(MOCK_TYPES);
    setTags(MOCK_TAGS);
    setRevisions({});
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .order(sortBy, { ascending: sortDir === 'asc' });

      if (promptsError) throw promptsError;

      const { data: catData } = await supabase.from('categories').select('*').order('name');
      const { data: typeData } = await supabase.from('types').select('*').order('name');
      const { data: tagData } = await supabase.from('prompt_tags').select('*').order('name');
      const { data: revData } = await supabase
        .from('prompt_revisions')
        .select('*')
        .order('created_at', { ascending: false });

      const sortByName = (arr) => [...(arr || [])].sort((a, b) => a.name.localeCompare(b.name, 'it'));

      setPrompts(promptsData || []);
      setCategories(sortByName(catData?.length > 0 ? catData : MOCK_CATEGORIES));
      setTypes(sortByName(typeData?.length > 0 ? typeData : MOCK_TYPES));
      setTags(sortByName(tagData?.length > 0 ? tagData : MOCK_TAGS));

      // Group revisions by prompt_id: { [prompt_id]: [...revisions] }
      if (revData) {
        const grouped = revData.reduce((acc, rev) => {
          if (!acc[rev.prompt_id]) acc[rev.prompt_id] = [];
          acc[rev.prompt_id].push(rev);
          return acc;
        }, {});
        setRevisions(grouped);
      } else {
        setRevisions({});
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ show: true, message: 'Errore nel caricamento dei dati.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (username, password) => {
    if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem('bob_authenticated', 'true');
      setIsLoginModalOpen(false);
      fetchData();
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('bob_authenticated');
    supabase.auth.signOut();
    triggerHaptic('light');
  };

  const ensureAuth = (action) => {
    if (session || isAuthenticated) {
      action();
    } else {
      triggerHaptic('warning');
      setIsAuthGuardOpen(true);
    }
  };

  const handleCopy = (title) => {
    triggerHaptic('success');
    setToast({ show: true, message: `"${title}" copiato!`, type: 'success' });
  };

  const handleDelete = async (id) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        const { error } = await supabase.from('prompts').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
        setToast({ show: true, message: 'Prompt eliminato con successo', type: 'success' });
        triggerHaptic('warning');
      } catch (error) {
        console.error('Error deleting:', error);
        setToast({ show: true, message: 'Errore durante l\'eliminazione', type: 'error' });
      } finally {
        setIsSaving(false);
      }
      setIsModalOpen(false);
    });
  };

  const handleSave = async (formData, saveAsRevision = false) => {
    ensureAuth(async () => {
      const newPrompt = {
        ...formData,
        tags: formData.tags || [],
        updated_at: new Date().toISOString()
      };

      try {
        setIsSaving(true);
        if (modalInitialData) {
          if (saveAsRevision) {
            const { error: revError } = await supabase.from('prompt_revisions').insert([{
              prompt_id: modalInitialData.id,
              title: modalInitialData.title,
              content: modalInitialData.content,
              category: modalInitialData.category,
              type: modalInitialData.type,
              tags: modalInitialData.tags || [],
            }]);
            if (revError) throw revError;
          }
          const { error } = await supabase.from('prompts').update(newPrompt).eq('id', modalInitialData.id);
          if (error) throw error;
          setToast({ show: true, message: saveAsRevision ? 'Revisione salvata con successo!' : 'Prompt aggiornato!', type: 'success' });
        } else {
          const { error } = await supabase.from('prompts').insert([{ ...newPrompt, is_favorite: false }]);
          if (error) throw error;
          setToast({ show: true, message: 'Nuovo prompt salvato!', type: 'success' });
        }
        await fetchData(); // Always refetch from DB
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving:', error);
        setToast({ show: true, message: 'Errore: ' + (error.message || 'salvataggio fallito'), type: 'error' });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleDuplicate = async (prompt) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        const { id, created_at, updated_at, ...rest } = prompt;
        const duplicate = {
          ...rest,
          title: `Copia di ${prompt.title}`,
          is_favorite: false,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('prompts').insert([duplicate]);
        if (error) throw error;
        await fetchData();
        setToast({ show: true, message: `"${prompt.title}" duplicato!`, type: 'success' });
        triggerHaptic('success');
      } catch (error) {
        console.error('Error duplicating:', error);
        setToast({ show: true, message: 'Errore durante la duplicazione', type: 'error' });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    ensureAuth(async () => {
      try {
        setIsSaving(true);
        const { error } = await supabase.from('prompts').update({ is_favorite: !currentStatus }).eq('id', id);
        if (error) throw error;
        await fetchData();
        setToast({ show: true, message: !currentStatus ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', type: 'success' });
        triggerHaptic('light');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        setToast({ show: true, message: 'Errore durante l\'operazione', type: 'error' });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleExportPrompts = () => {
    try {
      triggerHaptic('success');

      const exportData = {
        version: "1.0.0",
        exported_at: new Date().toISOString(),
        prompts: filteredPrompts.map(p => ({
          title: p.title,
          content: p.content,
          category: p.category,
          type: p.type,
          tags: p.tags,
          is_favorite: p.is_favorite
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bob-prompts-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({ show: true, message: `${filteredPrompts.length} prompt esportati!`, type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ show: true, message: 'Errore durante l\'esportazione', type: 'error' });
    }
  };

  const handleOpenCompile = (prompt) => {
    const vars = extractVariables(prompt.content);
    if (vars.length > 0) {
      triggerHaptic('light');
      setCompileModal({ isOpen: true, prompt, variables: vars, inputs: {} });
    } else {
      navigator.clipboard.writeText(prompt.content);
      triggerHaptic('success');
      handleCopy(prompt.title);
    }
  };

  const handleCompile = () => {
    if (!compileModal.prompt) return '';
    let content = compileModal.prompt.content;
    Object.entries(compileModal.inputs).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || `{{${key}}}`);
    });
    return content;
  };

  const getMetadataTable = () => {
    if (settingsMode === 'categories') return 'categories';
    if (settingsMode === 'types') return 'types';
    return 'prompt_tags';
  };

  const handleAddMetadata = async (item) => {
    const table = getMetadataTable();
    try {
      setIsSaving(true);
      const { error } = await supabase.from(table).insert([{ name: item.name, color: item.color }]);
      if (error) throw error;
      await fetchData();
      setToast({ show: true, message: 'Elemento aggiunto', type: 'success' });
    } catch (error) {
      console.error('Error adding metadata:', error);
      setToast({ show: true, message: 'Errore: ' + (error.message || 'aggiunta fallita'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMetadata = async (id, updatedItem) => {
    const table = getMetadataTable();
    try {
      setIsSaving(true);
      const { error } = await supabase.from(table).update({ name: updatedItem.name, color: updatedItem.color }).eq('id', id);
      if (error) throw error;
      await fetchData();
      setToast({ show: true, message: 'Elemento aggiornato', type: 'success' });
    } catch (error) {
      console.error('Error updating metadata:', error);
      setToast({ show: true, message: 'Errore: ' + (error.message || 'aggiornamento fallito'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMetadata = async (id) => {
    const table = getMetadataTable();

    // #9: Warn if taxonomy item is still in use by prompts
    if (settingsMode === 'categories' || settingsMode === 'types') {
      const field = settingsMode === 'categories' ? 'category' : 'type';
      const itemName = (settingsMode === 'categories' ? categories : types).find(i => i.id === id)?.name;
      const usedBy = prompts.filter(p => p[field] === itemName);
      if (usedBy.length > 0) {
        const confirmed = window.confirm(
          `"${itemName}" è ancora usata da ${usedBy.length} prompt. Eliminandola, quei prompt perderanno questa ${settingsMode === 'categories' ? 'categoria' : 'tipo'}. Continuare?`
        );
        if (!confirmed) return;
      }
    }

    try {
      setIsSaving(true);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      setToast({ show: true, message: 'Elemento rimosso', type: 'success' });
    } catch (error) {
      console.error('Error deleting metadata:', error);
      setToast({ show: true, message: 'Errore: ' + (error.message || 'rimozione fallita'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = activeCategory === 'Tutti' || prompt.category === activeCategory;
    const matchesType = activeType === 'Tutti' || prompt.type === activeType;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => (prompt.tags || []).includes(tag));
    const matchesSearch = (prompt.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (prompt.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavorites || prompt.is_favorite;
    return matchesCategory && matchesType && matchesTags && matchesSearch && matchesFavorites;
  });

  const isLoggedIn = session || isAuthenticated;

  if (loading && prompts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 sm:pb-10">
      <Header
        searchRef={searchInputRef}
        onSearch={setSearchQuery}
        onSettings={() => setIsFilterSidebarOpen(true)}
        userEmail={session?.user?.email || (isAuthenticated ? AUTH_CONFIG.username : '')}
        showFavorites={showFavorites}
        onToggleFavorites={() => { triggerHaptic('light'); setShowFavorites(!showFavorites); }}
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onExport={handleExportPrompts}
      />

      {/* Global saving indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-sky-600 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Salvataggio...</span>
        </div>
      )}

      <main id="main" className="max-w-7xl mx-auto">
        <CategoryMenu
          categories={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' } }, ...categories]}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <div className="px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {activeCategory === 'Tutti' ? 'Tutti i Prompt' : activeCategory}
              <span className="ml-2 text-sm font-normal text-slate-400">({filteredPrompts.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {/* Sort Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    const nextBy = sortBy === 'created_at' ? 'updated_at' : 'created_at';
                    setSortBy(nextBy);
                    localStorage.setItem('bob_sort_by', nextBy);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                  title={sortBy === 'created_at' ? 'Ordine: Data Creazione' : 'Ordine: Data Modifica'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{sortBy === 'created_at' ? 'Creazione' : 'Modifica'}</span>
                </button>
              </div>
              {/* Direction Toggle */}
              <button
                onClick={() => {
                  const nextDir = sortDir === 'desc' ? 'asc' : 'desc';
                  setSortDir(nextDir);
                  localStorage.setItem('bob_sort_dir', nextDir);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                title={sortDir === 'desc' ? 'Dal più recente' : 'Dal più vecchio'}
              >
                {sortDir === 'desc' ? '↓ Recenti' : '↑ Vecchi'}
              </button>
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-sky-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-sky-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
            {filteredPrompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                categories={categories}
                types={types}
                viewMode={viewMode}
                onCopy={handleCopy}
                onEdit={(p) => ensureAuth(() => { setModalInitialData(p); setIsModalOpen(true); })}
                onToggleFavorite={handleToggleFavorite}
                onCompile={handleOpenCompile}
                onView={(p) => setViewModal({ isOpen: true, prompt: p })}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><Loader2 className="w-8 h-8 text-slate-400" /></div>
              <h3 className="text-lg font-medium">Nessun prompt trovato</h3>
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => ensureAuth(() => { setModalInitialData(null); setIsModalOpen(true); })}
        className="hidden sm:flex fixed bottom-6 right-6 w-14 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus className="w-7 h-7" />
      </button>

      <BottomNav
        activeTab={searchQuery ? 'search' : 'filters'}
        onTabChange={(tab) => {
          if (tab === 'filters') setIsFilterSidebarOpen(true);
          if (tab === 'search') {
            triggerHaptic('light');
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }
        }}
        onNewPrompt={() => ensureAuth(() => { setModalInitialData(null); setIsModalOpen(true); })}
        showFavorites={showFavorites}
        onToggleFavorites={() => { triggerHaptic('light'); setShowFavorites(!showFavorites); }}
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        categories={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' } }, ...categories]}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => { setActiveCategory(cat); setIsFilterSidebarOpen(false); }}
        types={types}
        activeType={activeType}
        onSelectType={(type) => { setActiveType(type); setIsFilterSidebarOpen(false); }}
        tags={tags}
        selectedTags={selectedTags}
        onSelectTags={setSelectedTags}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites(!showFavorites)}
        onResetFilters={() => {
          setActiveCategory('Tutti');
          setActiveType('Tutti');
          setSelectedTags([]);
          setShowFavorites(false);
          setSearchQuery('');
          setIsFilterSidebarOpen(false);
        }}
        isLoggedIn={isLoggedIn}
        onOpenSettings={(mode) => { setSettingsMode(mode); setIsFilterSidebarOpen(false); setIsSettingsOpen(true); }}
      />

      <SettingsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={(mode) => { setSettingsMode(mode); setIsSidebarOpen(false); setIsSettingsOpen(true); }}
        onLogout={handleLogout}
        userEmail={session?.user?.email || (isAuthenticated ? AUTH_CONFIG.username : '')}
        types={types}
        activeType={activeType}
        onSelectType={setActiveType}
        tags={tags}
        selectedTags={selectedTags}
        onSelectTags={setSelectedTags}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites(!showFavorites)}
      />

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={modalInitialData}
        categories={categories.map(c => c.name)}
        types={types.map(t => t.name)}
        promptTags={tags.map(t => t.name)}
        revisions={modalInitialData ? (revisions[modalInitialData.id] || []) : []}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={settingsMode}
        items={settingsMode === 'categories' ? categories : settingsMode === 'types' ? types : tags}
        onAddItem={handleAddMetadata}
        onUpdateItem={handleUpdateMetadata}
        onDeleteItem={handleDeleteMetadata}
      />

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
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2"
                    onChange={(e) => setCompileModal({ ...compileModal, inputs: { ...compileModal.inputs, [v]: e.target.value } })}
                  />
                </div>
              ))}
              <div className="bg-slate-900 rounded-xl p-4 mt-6">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono uppercase text-[10px] mb-2">Anteprima Risultante</pre>
                <div className="text-slate-200 whitespace-pre-wrap">{handleCompile()}</div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t flex gap-4">
              <button
                onClick={() => { triggerHaptic('success'); navigator.clipboard.writeText(handleCompile()); setCompileModal({ ...compileModal, isOpen: false }); setToast({ show: true, message: 'Prompt compilato e copiato!', type: 'success' }); }}
                className="flex-1 bg-sky-600 text-white font-bold py-3 rounded-xl"
              >
                Copia & Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast.message}
        </div>
      )}

      {isLoginModalOpen && (
        <Login onLogin={handleLogin} onClose={() => setIsLoginModalOpen(false)} />
      )}

      <PromptViewModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, prompt: null })}
        prompt={viewModal.prompt}
        onCopy={handleCopy}
        onCompile={handleOpenCompile}
        onEdit={(p) => ensureAuth(() => { setModalInitialData(p); setIsModalOpen(true); })}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleFavorite={handleToggleFavorite}
      />

      <AuthGuardModal
        isOpen={isAuthGuardOpen}
        onClose={() => setIsAuthGuardOpen(false)}
        onLogin={() => setIsLoginModalOpen(true)}
      />
    </div>
  );
}
