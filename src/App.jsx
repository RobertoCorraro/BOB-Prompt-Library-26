import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import CategoryMenu from './components/CategoryMenu';
import FilterBar from './components/FilterBar';
import PromptCard from './components/PromptCard';
import Toast from './components/Toast';
import AdminModal from './components/AdminModal';

// Mock data for when Supabase is not connected
const MOCK_PROMPTS = [
  {
    id: '1',
    title: 'Generatore di Titoli YouTube',
    content: 'Agisci come un esperto di YouTube. Genera 10 titoli clickbait ma onesti per un video su [ARGOMENTO]. I titoli devono essere sotto i 60 caratteri e includere parole chiave emotive.',
    category: 'Marketing',
    type: 'Prompt template',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Analisi Sentiment Recensioni',
    content: 'Analizza le seguenti recensioni e categorizzale in Positive, Negative o Neutre. Per ogni categoria, estrai i temi ricorrenti.\n\nRecensioni:\n[INCOLLA RECENSIONI QUI]',
    category: 'Business',
    type: 'System Prompt',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Spiegazione Concetti Complessi',
    content: 'Spiegami [CONCETTO] come se avessi 5 anni. Usa analogie semplici e vita quotidiana.',
    category: 'Psicologia',
    type: 'Prompt parziale',
    created_at: new Date().toISOString()
  }
];

function App() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeType, setActiveType] = useState('Tutti');
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  const isSupabaseConfigured = !supabase.supabaseUrl.includes('your-project');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const showToast = (message) => {
    setToast({ message, isVisible: true });
  };

  const handleSavePrompt = async (promptData) => {
    if (isSupabaseConfigured) {
      if (editingPrompt) {
        const { error } = await supabase
          .from('prompts')
          .update(promptData)
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
        setPrompts(prompts.map(p => p.id === editingPrompt.id ? { ...p, ...promptData } : p));
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

  const filteredPrompts = prompts.filter(prompt => {
    const matchCategory = activeCategory === 'Tutti' || prompt.category === activeCategory;
    const matchType = activeType === 'Tutti' || prompt.type === activeType;
    return matchCategory && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <CategoryMenu
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <main className="max-w-4xl mx-auto">
        <FilterBar
          activeType={activeType}
          onSelectType={setActiveType}
        />

        <div className="px-4 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Caricamento prompt...</p>
            </div>
          ) : filteredPrompts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPrompts.map(prompt => (
                <div key={prompt.id} className="relative group/card">
                  <PromptCard
                    prompt={prompt}
                    onCopy={(title) => showToast(`Prompt "${title}" copiato!`)}
                  />
                  {/* Edit Button (Visible on hover or always on mobile?) - Let's make it accessible via long press or a small edit icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPrompt(prompt);
                      setIsModalOpen(true);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 z-10"
                    title="Modifica"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <p>Nessun prompt trovato.</p>
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
