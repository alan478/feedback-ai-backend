import type { OnboardingState, NicheType } from '../types/onboarding';

/**
 * Single LLM call to extract structured data from user input
 * This optimizes cost by doing all extraction in one call
 */
export async function extractStructuredData(
  userInput: string,
  currentState: OnboardingState
): Promise<{
  updatedFields: Partial<OnboardingState>;
  missingFields: string[];
  nextQuestions: { question: string; field: string; options?: string[] }[];
  confidence: number;
}> {
  // In production, this would call Claude/GPT with a structured prompt
  // For now, we'll simulate the response

  const prompt = buildExtractionPrompt(userInput, currentState);

  // TODO: Replace with actual LLM API call
  // const response = await callLLM(prompt);

  // Simulated extraction logic (replace with actual LLM call)
  const extracted = simulateExtraction(userInput, currentState);

  return extracted;
}

/**
 * Build prompt for LLM extraction
 */
function buildExtractionPrompt(userInput: string, currentState: OnboardingState): string {
  return `You are helping onboard a business to an AI Front Desk product.

Current State:
${JSON.stringify(currentState, null, 2)}

User Input: "${userInput}"

Extract and return a JSON object with:
1. "updatedFields": Object with any fields you can extract from the input
   - businessName
   - businessDescription
   - niche (one of: dental_clinic, medical_practice, boutique_retail, restaurant, saas_product, etc.)
   - industry
   - targetCustomers
   - primaryServices
   - agentCapabilities (array)
   - escalationStrategy
   - tone

2. "missingFields": Array of fields still needed (max 3 most important)

3. "nextQuestions": Array of 1-2 niche-specific questions to ask next
   Each question object should have:
   - question: the question text
   - field: which field it fills
   - options: optional array of button options

4. "confidence": 0-1 score of how certain you are about the niche detection

Rules:
- Only ask for critical information
- Make questions conversational, not form-like
- Offer button options when possible
- Don't ask what's already known
- Prioritize niche-specific questions

Return ONLY valid JSON, no other text.`;
}

/**
 * Simulated extraction (replace with actual LLM in production)
 */
function simulateExtraction(
  userInput: string,
  currentState: OnboardingState
): {
  updatedFields: Partial<OnboardingState>;
  missingFields: string[];
  nextQuestions: { question: string; field: string; options?: string[] }[];
  confidence: number;
} {
  const lowerInput = userInput.toLowerCase();
  const updatedFields: Partial<OnboardingState> = {};
  const missingFields: string[] = [];
  const nextQuestions: any[] = [];
  let confidence = 0.5;

  // Extract business name
  if (!currentState.businessName) {
    const nameMatch = lowerInput.match(/(?:called|named|i run|i have|my business is)\s+([A-Z][A-Za-z\s&'-]+?)(?:\.|,|$|\s+(?:that|which|where|and))/i);
    if (nameMatch) {
      updatedFields.businessName = nameMatch[1].trim();
    }
  }

  // Detect niche with higher accuracy
  if (!currentState.niche) {
    if (lowerInput.includes('dental') || lowerInput.includes('dentist')) {
      updatedFields.niche = 'dental_clinic' as NicheType;
      updatedFields.industry = 'healthcare';
      confidence = 0.9;

      nextQuestions.push({
        question: 'What services does your dental practice offer?',
        field: 'primaryServices',
        options: ['Cleanings', 'Fillings', 'Cosmetic', 'Implants', 'Emergency'],
      });

      missingFields.push('primaryServices', 'agentCapabilities');
    } else if (lowerInput.includes('restaurant') || lowerInput.includes('cafe') || lowerInput.includes('food')) {
      updatedFields.niche = 'restaurant' as NicheType;
      updatedFields.industry = 'food_beverage';
      confidence = 0.85;

      nextQuestions.push({
        question: 'What type of cuisine do you serve?',
        field: 'nicheData',
      });

      missingFields.push('primaryServices', 'agentCapabilities');
    } else if (lowerInput.includes('software') || lowerInput.includes('saas') || lowerInput.includes('app')) {
      updatedFields.niche = 'saas_product' as NicheType;
      updatedFields.industry = 'saas';
      confidence = 0.85;

      nextQuestions.push({
        question: 'What does your software help people do?',
        field: 'businessDescription',
      });

      missingFields.push('agentCapabilities', 'tone');
    } else {
      nextQuestions.push({
        question: 'What type of business is this?',
        field: 'niche',
        options: ['Healthcare', 'Retail', 'Restaurant', 'SaaS', 'Services'],
      });

      missingFields.push('niche', 'primaryServices');
    }
  }

  // Extract capabilities intent
  if (lowerInput.includes('bookings') || lowerInput.includes('appointments')) {
    updatedFields.agentCapabilities = ['answer_questions', 'take_bookings', 'check_availability'];
  }

  // If we have niche but no capabilities yet
  if (currentState.niche && !currentState.agentCapabilities && nextQuestions.length === 0) {
    nextQuestions.push({
      question: 'What should your AI Front Desk be able to do?',
      field: 'agentCapabilities',
      options: [
        'Answer questions',
        'Take bookings',
        'Process orders',
        'Do everything (Recommended)',
      ],
    });

    missingFields.push('agentCapabilities', 'escalationStrategy');
  }

  // If we have capabilities but no escalation
  if (currentState.agentCapabilities && !currentState.escalationStrategy && nextQuestions.length === 0) {
    nextQuestions.push({
      question: "When the AI can't help, what should happen?",
      field: 'escalationStrategy',
      options: [
        'Hand off to human (Recommended)',
        'AI handles everything',
        'Collect info & notify later',
      ],
    });

    missingFields.push('escalationStrategy');
  }

  // If we have most things, ask about tone
  if (
    currentState.niche &&
    currentState.agentCapabilities &&
    currentState.escalationStrategy &&
    !currentState.tone &&
    nextQuestions.length === 0
  ) {
    nextQuestions.push({
      question: 'How should your AI sound?',
      field: 'tone',
      options: ['Friendly & Warm', 'Professional', 'Helpful', 'Concise'],
    });

    missingFields.push('tone');
  }

  // If everything is set, we're done
  if (currentState.niche && currentState.agentCapabilities && currentState.tone && nextQuestions.length === 0) {
    return {
      updatedFields,
      missingFields: [],
      nextQuestions: [],
      confidence: 1.0,
    };
  }

  return {
    updatedFields,
    missingFields,
    nextQuestions,
    confidence,
  };
}

/**
 * Integration point for actual LLM API
 */
async function callLLM(prompt: string): Promise<any> {
  // TODO: Implement actual LLM API call
  // Example with Claude:
  /*
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Use Haiku for cost optimization
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
  */

  throw new Error('LLM integration not implemented yet');
}
