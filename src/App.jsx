import React, { useState, useEffect } from 'react';
import { Plus, Loader2, LayoutGrid, List, X, Braces, RefreshCw, Copy } from 'lucide-react';
import { supabase } from './lib/supabase';
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
import SettingsSidebar from './components/SettingsSidebar';

// Mock data for when Supabase is not connected
const MOCK_CATEGORIES = [
  { id: '1', name: 'Psicologia', color: COLOR_PALETTE[8] }, // Purple
  { id: '2', name: 'Marketing', color: COLOR_PALETTE[0] },  // Red
  { id: '3', name: 'Business', color: COLOR_PALETTE[6] },   // Blue
  { id: '4', name: 'Copywriting', color: COLOR_PALETTE[3] }, // Green
  { id: '5', name: 'Coding', color: COLOR_PALETTE[9] }      // Pink
];

const MOCK_TYPES = [
  { id: '1', name: 'Prompt parziale', color: COLOR_PALETTE[5] }, // Cyan
  { id: '2', name: 'Prompt template', color: COLOR_PALETTE[2] }, // Amber
  { id: '3', name: 'System Prompt', color: COLOR_PALETTE[7] },   // Indigo
  { id: '4', name: 'Esempio one-shot', color: COLOR_PALETTE[1] } // Orange
];

const MOCK_TAGS = [
  { id: '1', name: 'SEO', color: COLOR_PALETTE[4] }, // Emerald
  { id: '2', name: 'Social Media', color: COLOR_PALETTE[9] }, // Pink
  { id: '3', name: 'Email', color: COLOR_PALETTE[2] }, // Amber
  { id: '4', name: 'Productivity', color: COLOR_PALETTE[6] } // Blue
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

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Settings State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState('categories');

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

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    localStorage.setItem('bob_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    // Only persist to local storage if not logged in or if we want a local cache
    // Let's always persist to have a fallback, but mark it as 'local'
    if (!session && !isAuthenticated) {
      localStorage.setItem('bob_local_prompts', JSON.stringify(prompts));
      localStorage.setItem('bob_local_categories', JSON.stringify(categories));
      localStorage.setItem('bob_local_types', JSON.stringify(types));
      localStorage.setItem('bob_local_tags', JSON.stringify(tags));
      localStorage.setItem('bob_local_revisions', JSON.stringify(revisions));
    }
  }, [prompts, categories, types, tags, revisions, session, isAuthenticated]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session || sessionStorage.getItem('bob_authenticated') === 'true') {
        fetchData();
      } else {
        loadMockData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session || sessionStorage.getItem('bob_authenticated') === 'true') {
        fetchData();
      } else {
        loadMockData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMockData = () => {
    const localPrompts = localStorage.getItem('bob_local_prompts');
    const localCategories = localStorage.getItem('bob_local_categories');
    const localTypes = localStorage.getItem('bob_local_types');
    const localTags = localStorage.getItem('bob_local_tags');
    const localRevisions = localStorage.getItem('bob_local_revisions');

    if (localPrompts) setPrompts(JSON.parse(localPrompts));
    else setPrompts(MOCK_PROMPTS);

    if (localCategories) setCategories(JSON.parse(localCategories));
    else setCategories(MOCK_CATEGORIES);

    if (localTypes) setTypes(JSON.parse(localTypes));
    else setTypes(MOCK_TYPES);

    if (localTags) setTags(JSON.parse(localTags));
    else setTags(MOCK_TAGS);

    if (localRevisions) setRevisions(JSON.parse(localRevisions));

    setLoading(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (promptsError) throw promptsError;

      const { data: catData } = await supabase.from('categories').select('*').order('name');
      const { data: typeData } = await supabase.from('types').select('*').order('name');
      const { data: tagData } = await supabase.from('prompt_tags').select('*').order('name');

      if (promptsData) setPrompts(promptsData);
      setCategories(catData?.length > 0 ? catData : MOCK_CATEGORIES);
      setTypes(typeData?.length > 0 ? typeData : MOCK_TYPES);
      setTags(tagData?.length > 0 ? tagData : MOCK_TAGS);

    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ show: true, message: 'Errore nel caricamento dei dati', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (username, password) => {
    if (username === AUTH_CONFIG.adminUsername && password === AUTH_CONFIG.adminPassword) {
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
      setIsLoginModalOpen(true);
    }
  };

  const handleCopy = (title) => {
    triggerHaptic('success');
    setToast({ show: true, message: `"${title}" copiato!`, type: 'success' });
  };

  const handleDelete = async (id) => {
    ensureAuth(async () => {
      try {
        if (session) {
          const { error } = await supabase.from('prompts').delete().eq('id', id);
          if (error) throw error;
          fetchData();
        } else {
          setPrompts(prompts.filter(p => p.id !== id));
        }
        setToast({ show: true, message: 'Prompt eliminato con successo', type: 'success' });
        triggerHaptic('warning');
      } catch (error) {
        console.error('Error deleting:', error);
        setToast({ show: true, message: 'Errore durante l\'eliminazione', type: 'error' });
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
        if (session) {
          if (modalInitialData) {
            if (saveAsRevision) {
              await supabase.from('prompt_revisions').insert([{
                prompt_id: modalInitialData.id,
                title: modalInitialData.title,
                content: modalInitialData.content,
                category: modalInitialData.category,
                type: modalInitialData.type,
                tags: modalInitialData.tags || [],
              }]);
            }
            const { error } = await supabase.from('prompts').update(newPrompt).eq('id', modalInitialData.id);
            if (error) throw error;
            setToast({ show: true, message: 'Prompt aggiornato!', type: 'success' });
          } else {
            const { error } = await supabase.from('prompts').insert([{ ...newPrompt, is_favorite: false }]);
            if (error) throw error;
            setToast({ show: true, message: 'Nuovo prompt salvato!', type: 'success' });
          }
          fetchData();
        } else {
          // Local Mode
          if (modalInitialData) {
            if (saveAsRevision) {
              const revId = Date.now().toString();
              const newRev = {
                id: revId,
                prompt_id: modalInitialData.id,
                title: modalInitialData.title,
                content: modalInitialData.content,
                category: modalInitialData.category,
                type: modalInitialData.type,
                tags: modalInitialData.tags || [],
                versionDate: new Date().toISOString()
              };
              setRevisions(prev => ({
                ...prev,
                [modalInitialData.id]: [newRev, ...(prev[modalInitialData.id] || [])]
              }));
            }
            setPrompts(prompts.map(p => p.id === modalInitialData.id ? { ...p, ...newPrompt } : p));
            setToast({ show: true, message: 'Prompt aggiornato (locale)!', type: 'success' });
          } else {
            const id = Date.now().toString();
            setPrompts([{ ...newPrompt, id, is_favorite: false, created_at: new Date().toISOString() }, ...prompts]);
            setToast({ show: true, message: 'Nuovo prompt salvato (locale)!', type: 'success' });
          }
        }
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving:', error);
        setToast({ show: true, message: 'Errore durante il salvataggio', type: 'error' });
      }
    });
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    ensureAuth(async () => {
      try {
        if (session) {
          const { error } = await supabase.from('prompts').update({ is_favorite: !currentStatus }).eq('id', id);
          if (error) throw error;
          fetchData();
        } else {
          setPrompts(prompts.map(p => p.id === id ? { ...p, is_favorite: !currentStatus } : p));
        }
        setToast({ show: true, message: !currentStatus ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', type: 'success' });
        triggerHaptic('light');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        setToast({ show: true, message: 'Errore durante l\'operazione', type: 'error' });
      }
    });
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

  const handleAddMetadata = (item) => {
    const newItem = { id: Date.now().toString(), name: item.name, color: item.color };
    if (settingsMode === 'categories') setCategories([...categories, newItem]);
    else if (settingsMode === 'types') setTypes([...types, newItem]);
    else setTags([...tags, newItem]);
    setToast({ show: true, message: 'Elemento aggiunto', type: 'success' });
  };

  const handleUpdateMetadata = (id, updatedItem) => {
    const updater = (list) => list.map(item => item.id === id ? { ...item, ...updatedItem } : item);
    if (settingsMode === 'categories') setCategories(updater(categories));
    else if (settingsMode === 'types') setTypes(updater(types));
    else setTags(updater(tags));
    setToast({ show: true, message: 'Elemento aggiornato', type: 'success' });
  };

  const handleDeleteMetadata = (id) => {
    if (settingsMode === 'categories') setCategories(categories.filter(c => c.id !== id));
    else if (settingsMode === 'types') setTypes(types.filter(t => t.id !== id));
    else setTags(tags.filter(t => t.id !== id));
    setToast({ show: true, message: 'Elemento rimosso', type: 'success' });
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
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 sm:pb-10">
      <Header
        onSearch={setSearchQuery}
        onSettings={() => setIsSidebarOpen(true)}
        userEmail={session?.user?.email || (isAuthenticated ? AUTH_CONFIG.adminUsername : '')}
        showFavorites={showFavorites}
        onToggleFavorites={() => { triggerHaptic('light'); setShowFavorites(!showFavorites); }}
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto py-6">
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
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus className="w-7 h-7" />
      </button>

      <SettingsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={(mode) => { setSettingsMode(mode); setIsSidebarOpen(false); setIsSettingsOpen(true); }}
        onLogout={handleLogout}
        userEmail={session?.user?.email}
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
                onClick={() => { triggerHaptic('success'); navigator.clipboard.writeText(handleCompile()); setCompileModal({ ...compileModal, isOpen: false }); }}
                className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl"
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
      />
    </div>
  );
}
