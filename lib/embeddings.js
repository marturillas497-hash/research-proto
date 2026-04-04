// lib/embeddings.js
/**
 * Generates a 512-dimension vector using Voyage AI voyage-3-lite. [cite: 15, 74]
 * @param {string} text - The content to embed.
 * @param {'query' | 'document'} type - 'query' for search, 'document' for saving abstracts. [cite: 164]
 */
export async function generateEmbedding(text, type = 'document') {
  if (!text) return null;

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-3-lite", // Matches EMBEDDING_DIM = 512 [cite: 15, 74]
      input_type: type
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Voyage AI Error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding; 
}