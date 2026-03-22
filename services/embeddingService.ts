/**
 * Embedding Service - Generates vector embeddings via OpenAI API
 * Used for both storing knowledge chunks and querying them
 */

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const EMBEDDING_MODEL = "text-embedding-3-large";
const CHAT_MODEL = "gpt-4o-mini";
const EMBEDDING_DIMENSION = 3072;

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return key;
}

/**
 * Generate embedding vector for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OPENAI_API_URL, {
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data[0]!.embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(OPENAI_API_URL, {
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
    throw new Error(`OpenAI Embedding API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data.map((item) => item.embedding);
}

/**
 * Generate a chat completion from OpenAI
 */
export async function generateChatCompletion(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await fetch(OPENAI_CHAT_URL, {
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Chat API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]!.message.content;
}

export { EMBEDDING_DIMENSION };
