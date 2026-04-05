// lib/embeddings.js
/**
 * Generates a 512-dimension vector using Voyage AI voyage-3-lite.
 * @param {string} text - The content to embed.
 * @param {'query' | 'document'} type - 'query' for search, 'document' for saving abstracts.
 */
export async function generateEmbedding(text, type = 'document') {
  if (!text) return null;

  // CHANGED: Added NEXT_PUBLIC_ prefix to allow browser access
  const apiKey = process.env.NEXT_PUBLIC_VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error("Voyage API Key is missing. Check your .env.local file.");
  }

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-3-lite", 
      input_type: type
    })
  });

  if (!response.ok) {
    const error = await response.json();
    // Voyage returns errors in 'detail', but we'll check 'message' as a fallback
    throw new Error(`Voyage AI Error: ${error.detail || error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding; 
}