import { supabase } from './src/lib/supabase';

async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('prompts').select('*').limit(1);

        if (error) {
            console.error('Errore nella connessione a Supabase:', error);
        } else {
            console.log('Connessione a Supabase riuscita. Dati:', data);
        }
    } catch (err) {
        console.error('Errore imprevisto:', err);
    }
}

testSupabaseConnection();