import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

console.log('✅ Geladene URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('✅ Geladener KEY:', process.env.SUPABASE_SERVICE_KEY?.slice(0, 10), '...');

// 🔁 __dirname für .mjs erzeugen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌱 .env.local laden
dotenv.config({ path: path.join(__dirname, '.env.local') });

// 🔑 Supabase-Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CSV_FILE = path.join(__dirname, 'datenSchwinger.csv');
const TABLE = 'schwinger';

const rows = [];

console.log('🔗 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// 📥 CSV einlesen und verarbeiten
fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', data => rows.push(data))
  .on('end', async () => {
    console.log(`🔄 Verarbeite ${rows.length} Zeilen...`);

    for (const row of rows) {
      const { id, ...updateFields } = row;

      const { error } = await supabase
        .from(TABLE)
        .update(updateFields)
        .eq('id', id);

      if (error) {
        console.error(`❌ Fehler bei ID ${id}:`, error.message);
      } else {
        console.log(`✅ ID ${id} aktualisiert`);
      }
    }

    console.log('🎉 Alle Daten aktualisiert!');
  });
