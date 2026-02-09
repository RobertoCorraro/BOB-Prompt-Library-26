import React, { useState, useEffect } from 'react';
import { Plus, Loader2, LayoutGrid, List } from 'lucide-react';
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
    tags: ['Psicologia', 'Analisi'], // Example tags matching names if possible, or new ones. Let's use names.
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

  // UI State
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [selectedTags, setSelectedTags] = useState([]); // Array of strings
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFavorites, setShowFavorites] = useState(false);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null); // Used for editing prompt

  // Settings State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState('categories'); // 'categories' | 'types' | 'tags'

  // Revisions State (Mock)
  const [revisions, setRevisions] = useState({}); // { promptId: [ {id, date, title, content...} ] }

  // Compilation State
  const [compileModal, setCompileModal] = useState({
    isOpen: false,
    prompt: null,
    variables: []
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      else loadMockData();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
      else loadMockData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMockData = () => {
    if (prompts.length === 0) {
      setPrompts(MOCK_PROMPTS);
      setCategories(MOCK_CATEGORIES);
      setTypes(MOCK_TYPES);
      setTags(MOCK_TAGS);
    }
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

      if (promptsData) {
        setPrompts(promptsData);
        // In a real app we would fetch categories/types/tags here
        setCategories(MOCK_CATEGORIES);
        setTypes(MOCK_TYPES);
        setTags(MOCK_TAGS);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleLogin = (username, password) => {
    if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem('bob_authenticated', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('bob_authenticated');
    supabase.auth.signOut();
  };

  // Prompt Handlers
  const handleCopy = (title) => {
    triggerHaptic('success');
    setToast({
      show: true,
      message: `"${title}" copiato!`,
      type: 'success'
    });
  };

  const handleDelete = async (id) => {
    if (session) {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) console.error('Error deleting:', error);
      else fetchData();
    } else {
      setPrompts(prompts.filter(p => p.id !== id));
    }
    setIsModalOpen(false);
  };

  const handleSave = async (formData, saveAsRevision = false) => {
    const newPrompt = {
      ...formData,
      tags: formData.tags || [], // Ensure tags are saved
      updated_at: new Date().toISOString()
    };

    if (session) {
      if (modalInitialData) {
        // Handle Revision logic (Mock for now, would be DB insert)
        if (saveAsRevision) {
          const revision = {
            id: Date.now().toString(),
            promptId: modalInitialData.id,
            ...modalInitialData,
            versionDate: new Date().toISOString()
          };
          setRevisions(prev => ({
            ...prev,
            [modalInitialData.id]: [revision, ...(prev[modalInitialData.id] || [])]
          }));
        }

        const { error } = await supabase
          .from('prompts')
          .update(newPrompt)
          .eq('id', modalInitialData.id);
        if (error) console.error('Error updating:', error);
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert([{ ...newPrompt, is_favorite: false }]);
        if (error) console.error('Error inserting:', error);
      }
      fetchData();
    } else {
      if (modalInitialData) {
        // Handle Revision logic (Local)
        if (saveAsRevision) {
          const revision = {
            id: Date.now().toString(),
            promptId: modalInitialData.id,
            ...modalInitialData,
            versionDate: new Date().toISOString()
          };
          setRevisions(prev => ({
            ...prev,
            [modalInitialData.id]: [revision, ...(prev[modalInitialData.id] || [])]
          }));
        }

        setPrompts(prompts.map(p => p.id === modalInitialData.id ? { ...p, ...newPrompt } : p));
      } else {
        setPrompts([{ ...newPrompt, id: Date.now().toString(), is_favorite: false, created_at: new Date().toISOString() }, ...prompts]);
      }
    }
    setIsModalOpen(false);
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    if (session) {
      const { error } = await supabase
        .from('prompts')
        .update({ is_favorite: !currentStatus })
        .eq('id', id);
      if (error) console.error('Error toggling favorite:', error);
      else fetchData();
    } else {
      setPrompts(prompts.map(p => p.id === id ? { ...p, is_favorite: !currentStatus } : p));
    }
  };

  // Compilation Handler
  const handleOpenCompile = (prompt) => {
    const variables = extractVariables(prompt.content);
    if (variables.length > 0) {
      triggerHaptic('light');
      setCompileModal({
        isOpen: true,
        prompt,
        variables
      });
    } else {
      navigator.clipboard.writeText(prompt.content);
      triggerHaptic('success');
    }
  };

  // Metadata Handlers
  const handleAddMetadata = (item) => {
    const newItem = {
      id: Date.now().toString(),
      name: item.name,
      color: item.color
    };
    if (settingsMode === 'categories') {
      setCategories([...categories, newItem]);
    } else if (settingsMode === 'types') {
      setTypes([...types, newItem]);
    } else {
      setTags([...tags, newItem]);
    }
  };

  const handleUpdateMetadata = (id, updatedItem) => {
    const updater = (list) => list.map(item =>
      item.id === id ? { ...item, ...updatedItem } : item
    );
    if (settingsMode === 'categories') {
      setCategories(updater(categories));
    } else if (settingsMode === 'types') {
      setTypes(updater(types));
    } else {
      setTags(updater(tags));
    }
  };

  const handleDeleteMetadata = (id) => {
    if (settingsMode === 'categories') {
      setCategories(categories.filter(c => c.id !== id));
    } else if (settingsMode === 'types') {
      setTypes(types.filter(t => t.id !== id));
    } else {
      setTags(tags.filter(t => t.id !== id));
    }
  };

  const handleOpenSettingsFromSidebar = (mode) => {
    setSettingsMode(mode);
    setIsSidebarOpen(false);
    setTimeout(() => setIsSettingsOpen(true), 150); // Small delay for smoother transition
  };

  // Filtering
  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = activeCategory === 'Tutti' || prompt.category === activeCategory;
    const matchesType = activeType === 'Tutti' || prompt.type === activeType;
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => (prompt.tags || []).includes(tag));
    const matchesSearch = (prompt.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (prompt.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesCategory && matchesType && matchesTags && matchesSearch;
  });

  const isLoggedIn = session || isAuthenticated;

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading && prompts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 sm:pb-10">
      <Header
        onSearch={setSearchQuery}
        onSettings={() => setIsSidebarOpen(true)}
        userEmail={session?.user?.email || 'User'}
        showFavorites={showFavorites}
        onToggleFavorites={() => {
          triggerHaptic('light');
          setShowFavorites(!showFavorites);
        }}
      />

      <main className="max-w-7xl mx-auto transition-all duration-300">
        <CategoryMenu
          categories={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' } }, ...categories]}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <div className="hidden md:block">
          <FilterBar
            types={[{ id: 'all', name: 'Tutti', color: { bg: 'bg-white', text: 'text-slate-600' } }, ...types]}
            activeType={activeType}
            onSelectType={(t) => setActiveType(typeof t === 'string' ? t : t.name)}
          />
        </div>
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {activeCategory === 'Tutti' ? 'Tutti i Prompt' : activeCategory}
              <span className="ml-2 text-sm font-normal text-slate-400">({filteredPrompts.length})</span>
            </h2>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                title="Vista Griglia"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setViewMode('list');
                }}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                title="Vista Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`grid gap-6 ${viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 max-w-3xl mx-auto'
            }`}>
            {filteredPrompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                categories={categories}
                types={types}
                viewMode={viewMode}
                onCopy={handleCopy}
                onEdit={(p) => {
                  setModalInitialData(p);
                  setIsModalOpen(true);
                }}
                onToggleFavorite={handleToggleFavorite}
                onCompile={handleOpenCompile}
              />
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Nessun prompt trovato</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                Non ci sono prompt che corrispondono ai tuoi criteri di ricerca.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setModalInitialData(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modals/Sidebars */}
      <SettingsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={handleOpenSettingsFromSidebar}
        onLogout={handleLogout}
        userEmail={session?.user?.email}

        // Pass Filtering Props
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
        promptTags={tags.map(t => t.name)} // Pass real tags
        revisions={modalInitialData ? (revisions[modalInitialData.id] || []) : []}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={
          settingsMode === 'categories' ? 'Categorie' :
            settingsMode === 'types' ? 'Tipologie' :
              'Tag'
        }
        items={
          settingsMode === 'categories' ? categories :
            settingsMode === 'types' ? types :
              tags
        }
        onAddItem={handleAddMetadata}
        onUpdateItem={handleUpdateMetadata}
        onDeleteItem={handleDeleteMetadata}
        isLoading={false}
      />

      <VariableModal
        isOpen={compileModal.isOpen}
        onClose={() => setCompileModal({ ...compileModal, isOpen: false })}
        prompt={compileModal.prompt}
        variables={compileModal.variables}
      />
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toast.type === 'success' ? (
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : null}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
