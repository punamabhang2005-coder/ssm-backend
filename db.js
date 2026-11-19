require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function saveEssay(studentName, content) {
  const { data, error } = await supabase
    .from('essays')
    .insert({ student_name: studentName, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getAllEssays() {
  const { data, error } = await supabase
    .from('essays')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function saveComparisons(essayId, results) {
  if (results.length === 0) return;
  const rows = results.map(r => ({
    essay_id: essayId,
    compared_essay_id: r.essayId,
    similarity_score: r.score
  }));
  const { error } = await supabase.from('comparisons').insert(rows);
  if (error) throw error;
}

async function getComparisons(essayId) {
  const { data, error } = await supabase
    .from('comparisons')
    .select('compared_essay_id, similarity_score, created_at')
    .eq('essay_id', essayId)
    .order('similarity_score', { ascending: false });
  if (error) throw error;
  return data;
}

module.exports = { saveEssay, getAllEssays, saveComparisons, getComparisons };