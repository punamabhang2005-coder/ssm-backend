let extractor = null;

// Loads the MiniLM model (only once)
async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import('@huggingface/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

// Turns a text into 384 numbers
async function getEmbedding(text) {
  const model = await getExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Measures how close two lists of numbers are (0 to 1)
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Compares a new essay with a list of old essays
async function compareEssays(newText, previousEssays) {
  const newVec = await getEmbedding(newText);
  const results = [];

  for (const old of previousEssays) {
    const oldVec = await getEmbedding(old.content);
    results.push({
      essayId: old.id,
      studentName: old.student_name,
      score: cosineSimilarity(newVec, oldVec)
    });
  }

  results.sort((x, y) => y.score - x.score); // most similar first
  return results;
}

module.exports = { compareEssays };