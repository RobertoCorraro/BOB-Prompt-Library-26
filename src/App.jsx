import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AUTH_CONFIG } from './auth.config';
import Login from './components/Login';
import Header from './components/Header';
import CategoryMenu from './components/CategoryMenu';
import FilterBar from './components/FilterBar';
import PromptCard from './components/PromptCard';
import AdminModal from './components/AdminModal';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import SearchBar from './components/SearchBar';
import SortDropdown from './components/SortDropdown';

// Mock data for when Supabase is not connected
const MOCK_CATEGORIES = [
  { id: '1', name: 'Psicologia' },
  { id: '2', name: 'Marketing' },
  { id: '3', name: 'Business' },
  { id: '4', name: 'Copywriting' },
  { id: '5', name: 'Coding' }
];

const MOCK_TYPES = [
  { id: '1', name: 'Prompt parziale' },
  { id: '2', name: 'Prompt template' },
  { id: '3', name: 'System Prompt' }
];

const MOCK_PROMPTS = [
  {
    id: '1',
    title: 'Generatore di Titoli YouTube',
    content: 'Agisci come un esperto di YouTube. Genera 10 titoli clickbait ma onesti per un video su [ARGOMENTO]. I titoli devono essere sotto i 60 caratteri e includere parole chiave emotive.',
    category: 'Marketing',
    type: 'Prompt template',
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: '2',
    title: 'Analisi Sentiment Recensioni',
    content: 'Analizza le seguenti recensioni e categorizzale in Positive, Negative o Neutre. Per ogni categoria, estrai i temi ricorrenti.\n\nRecensioni:\n[INCOLLA RECENSIONI QUI]',
    category: 'Business',
    type: 'System Prompt',
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: '3',
    title: 'Spiegazione Concetti Complessi',
    content: 'Spiegami [CONCETTO] come se avessi 5 anni. Usa analogie semplici e vita quotidiana.',
    category: 'Psicologia',
    type: 'Prompt parziale',
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('bob_authenticated') === 'true';
  });

  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [promptTags, setPromptTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState(null); // 'categories' or 'types'
  const [settingsLoading, setSettingsLoading] = useState(false);

  const isSupabaseConfigured = !supabase.supabaseUrl.includes('your-project');

  // Authentication handlers
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
    showToast('Logout effettuato con successo');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPrompts(), fetchMetadata()]);
    setLoading(false);
  };

  const fetchMetadata = async () => {
    if (isSupabaseConfigured) {
      const [cats, typs, tags] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('types').select('*').order('name'),
        supabase.from('prompt_tags').select('*').order('name')
      ]);

      if (!cats.error) setCategories(cats.data);
      if (!typs.error) setTypes(typs.data);
      if (!tags.error) setPromptTags(tags.data);
    } else {
      setCategories(MOCK_CATEGORIES);
      setTypes(MOCK_TYPES);
      setPromptTags([]);
    }
  };

  const fetchPrompts = async () => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setPrompts(data);
      } else {
        console.error('Error fetching prompts:', error);
        showToast('Errore nel caricamento dei prompt');
      }
    } else {
      // Use mock data
      setTimeout(() => {
        setPrompts(MOCK_PROMPTS);
      }, 500);
    }
    // setLoading(false); // Handled in fetchData
  };

  const showToast = (message) => {
    setToast({ message, isVisible: true });
  };

  const handleSavePrompt = async (promptData) => {
    if (isSupabaseConfigured) {
      if (editingPrompt) {
        const { error } = await supabase
          .from('prompts')
          .update({ ...promptData, updated_at: new Date().toISOString() })
          .eq('id', editingPrompt.id);

        if (!error) {
          showToast('Prompt aggiornato con successo');
          fetchPrompts();
        } else {
          showToast('Errore durante l\'aggiornamento');
        }
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert([promptData]);

        if (!error) {
          showToast('Prompt creato con successo');
          fetchPrompts();
        } else {
          showToast('Errore durante la creazione');
        }
      }
    } else {
      // Mock save
      if (editingPrompt) {
        setPrompts(prompts.map(p => p.id === editingPrompt.id ? { ...p, ...promptData, updated_at: new Date().toISOString() } : p));
        showToast('Prompt aggiornato (Mock)');
      } else {
        setPrompts([{ ...promptData, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prompts]);
        showToast('Prompt creato (Mock)');
      }
    }
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const handleDeletePrompt = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prompt?')) {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);

        if (!error) {
          showToast('Prompt eliminato');
          fetchPrompts();
        } else {
          showToast('Errore durante l\'eliminazione');
        }
      } else {
        setPrompts(prompts.filter(p => p.id !== id));
        showToast('Prompt eliminato (Mock)');
      }
      setIsModalOpen(false);
      setEditingPrompt(null);
    }
  };

  const handleToggleFavorite = async (promptId, currentState) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('prompts')
        .update({ is_favorite: !currentState })
        .eq('id', promptId);

      if (!error) {
        fetchPrompts();
        showToast(currentState ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
      } else {
        showToast('Errore durante l\'aggiornamento');
      }
    } else {
      setPrompts(prompts.map(p =>
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
      ));
      showToast(currentState ? 'Rimosso dai preferiti (Mock)' : 'Aggiunto ai preferiti (Mock)');
    }
  };

  // Settings Handlers
  const handleAddMetadata = async (name) => {
    setSettingsLoading(true);
    const table = settingsType === 'categories' ? 'categories' : settingsType === 'types' ? 'types' : 'prompt_tags';

    if (isSupabaseConfigured) {
      const { error } = await supabase.from(table).insert([{ name }]);
      if (!error) {
        const itemType = settingsType === 'categories' ? 'Categoria' : settingsType === 'types' ? 'Tipologia' : 'Prompt Tag';
        showToast(`${itemType} aggiunta`);
        fetchMetadata();
      } else {
        showToast('Errore durante l\'aggiunta');
      }
    } else {
      const newItem = { id: crypto.randomUUID(), name };
      if (settingsType === 'categories') setCategories([...categories, newItem]);
      else if (settingsType === 'types') setTypes([...types, newItem]);
      else setPromptTags([...promptTags, newItem]);
      const itemType = settingsType === 'categories' ? 'Categoria' : settingsType === 'types' ? 'Tipologia' : 'Prompt Tag';
      showToast(`${itemType} aggiunta (Mock)`);
    }
    setSettingsLoading(false);
  };

  const handleDeleteMetadata = async (id) => {
    if (!window.confirm('Sei sicuro?')) return;

    setSettingsLoading(true);
    const table = settingsType === 'categories' ? 'categories' : settingsType === 'types' ? 'types' : 'prompt_tags';

    if (isSupabaseConfigured) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        showToast('Elemento eliminato');
        fetchMetadata();
      } else {
        showToast('Errore durante l\'eliminazione');
      }
    } else {
      if (settingsType === 'categories') setCategories(categories.filter(c => c.id !== id));
      else if (settingsType === 'types') setTypes(types.filter(t => t.id !== id));
      else setPromptTags(promptTags.filter(tag => tag.id !== id));
      showToast('Elemento eliminato (Mock)');
    }
    setSettingsLoading(false);
  };

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const categoryMatch = activeCategory === 'Tutti' || prompt.category === activeCategory;
    const typeMatch = activeType === 'Tutti' || prompt.type === activeType;
    const searchMatch = searchQuery === '' ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && typeMatch && searchMatch;
  });

  // Sort prompts
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'a-z':
        return a.title.localeCompare(b.title);
      case 'z-a':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });


  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onOpenSettings={(type) => {
          setSettingsType(type);
          setIsSettingsOpen(true);
        }}
        onLogout={handleLogout}
      />

      <CategoryMenu
        categories={['Tutti', ...categories.map(c => c.name)]}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <main className="max-w-4xl mx-auto">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          <SortDropdown
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        <FilterBar
          types={['Tutti', ...types.map(t => t.name)]}
          activeType={activeType}
          onSelectType={setActiveType}
        />

        <div className="px-4 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Caricamento prompt...</p>
            </div>
          ) : sortedPrompts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg mb-2">Nessun prompt trovato</p>
              <p className="text-sm">Prova a modificare i filtri o la ricerca</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sortedPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onCopy={(title) => showToast(`Prompt "${title}" copiato!`)}
                  onEdit={(prompt) => {
                    setEditingPrompt(prompt);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingPrompt(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-300 transition-transform hover:scale-110 active:scale-95 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
        initialData={editingPrompt}
        categories={categories.map(c => c.name)}
        types={types.map(t => t.name)}
        promptTags={promptTags}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={settingsType === 'categories' ? 'Categorie' : settingsType === 'types' ? 'Tipologie' : 'Prompt Tags'}
        items={settingsType === 'categories' ? categories : settingsType === 'types' ? types : promptTags}
        onAddItem={handleAddMetadata}
        onDeleteItem={handleDeleteMetadata}
        isLoading={settingsLoading}
      />

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default App;
