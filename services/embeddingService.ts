/**
 * Embedding Service - Generates vector embeddings via xAI/Grok API
 * Used for both storing knowledge chunks and querying them
 */

const XAI_API_URL = "https://api.x.ai/v1/embeddings";
const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const EMBEDDING_MODEL = "v3";
const CHAT_MODEL = "grok-3-mini";
const EMBEDDING_DIMENSION = 3072;

function getApiKey(): string {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error("XAI_API_KEY environment variable is required");
  }
  return key;
}

/**
 * Generate embedding vector for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`[EMBED] Generating embedding, API URL: ${XAI_API_URL}`);
  const startTime = Date.now();
  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log(`[EMBED] Embedding API call took ${elapsed}ms`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI Embedding API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI Embedding API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data.map((item) => item.embedding);
}

/**
 * Generate a chat completion from Grok
 */
export async function generateChatCompletion(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  console.log(`[EMBED] Chat completion API URL: ${XAI_CHAT_URL}, model: ${CHAT_MODEL}`);
  const startTime = Date.now();
  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log(`[EMBED] Chat completion API call took ${elapsed}ms (model: ${CHAT_MODEL})`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI Chat API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

export { EMBEDDING_DIMENSION };
