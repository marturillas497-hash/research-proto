// lib/embeddings.js
let pipeline;
let env;
let extractor = null;

export async function generateEmbedding(text) {
  if (!text) return null;

  try {
    // Only load transformers when this function is actually called
    if (!pipeline) {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;
      env.allowLocalModels = false;
    }

    if (!extractor) {
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
}