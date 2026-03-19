import type {
  OnboardingState,
  OnboardingResponse,
  OnboardingQuestion,
  NicheType,
} from '../types/onboarding';
import {
  detectNiche,
  getIndustryFromNiche,
  extractBusinessName,
  isMultiNiche,
  getConfidenceAction,
} from './nicheDetection';
import {
  getNicheQuestions,
  getDefaultCapabilities,
  getDefaultTone,
  shouldSkipQuestion,
} from './questionStrategies';

// Onboarding stages
const STAGES = {
  INITIAL_INPUT: 0,
  ECHO_CONFIRMATION: 1,
  NICHE_DETECTION: 2,
  NICHE_DEEPENING: 3,
  SCOPE_DEFINITION: 4,
  KNOWLEDGE_SOURCES: 5,
  TONE_CONFIG: 6,
  FINAL_CONFIRMATION: 7,
};

/**
 * Process user input and return next step in onboarding
 * @param input - User's text input
 * @param state - Current onboarding state
 * @param directNiche - Optional: niche type passed directly from Quick Start
 */
export function processOnboardingInput(
  input: string,
  state: OnboardingState,
  directNiche?: NicheType
): OnboardingResponse {
  // Handle Quick Start: direct niche selection
  if (directNiche) {
    return handleQuickStartNiche(directNiche, state);
  }

  const currentStage = state.currentStage || STAGES.INITIAL_INPUT;

  // Add input to raw inputs
  state.rawInputs = [...(state.rawInputs || []), input];

  switch (currentStage) {
    case STAGES.INITIAL_INPUT:
      return handleInitialInput(input, state);

    case STAGES.ECHO_CONFIRMATION:
      return handleEchoConfirmation(input, state);

    case STAGES.NICHE_DETECTION:
      return handleNicheDetection(input, state);

    case STAGES.NICHE_DEEPENING:
      return handleNicheDeepening(input, state);

    case STAGES.SCOPE_DEFINITION:
      return handleScopeDefinition(input, state);

    case STAGES.KNOWLEDGE_SOURCES:
      return handleKnowledgeSources(input, state);

    case STAGES.TONE_CONFIG:
      return handleToneConfig(input, state);

    default:
      return {
        message: 'Something went wrong. Let\'s start over.',
        stage: STAGES.INITIAL_INPUT,
        completed: false,
        state,
      };
  }
}

/**
 * Handle Quick Start: direct niche selection
 * Skips niche detection and goes straight to niche-specific questions
 */
function handleQuickStartNiche(niche: NicheType, state: OnboardingState): OnboardingResponse {
  // Set niche directly with full confidence
  state.niche = niche;
  state.nicheConfidence = 1.0;
  state.industry = getIndustryFromNiche(niche);
  state.currentStage = STAGES.NICHE_DEEPENING;

  const nicheLabel = formatNicheLabel(niche);

  // Ask for business name first
  return {
    message: `Great choice! Let's set up your AI Front Desk for ${nicheLabel}.\n\nWhat's your business called?`,
    stage: STAGES.NICHE_DEEPENING,
    completed: false,
    state,
  };
}

/**
 * Stage 1: Handle initial free-form input
 */
function handleInitialInput(input: string, state: OnboardingState): OnboardingResponse {
  const lowerInput = input.toLowerCase();

  // Handle edge cases
  if (lowerInput.includes("start over") || lowerInput.includes("restart")) {
    return {
      message: "No problem! Let's start fresh. Tell me about your business.",
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state: initializeOnboarding(),
    };
  }

  // Validate input length
  if (input.length < 20) {
    return {
      message: "I need just a bit more detail. Could you tell me:\n• What do you sell or offer?\n• Is it online, in-person, or both?\n\nOr just describe your business in a sentence or two.",
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state,
    };
  }

  // Store description
  state.businessDescription = input;

  // Try to extract business name
  const extractedName = extractBusinessName(input);
  if (extractedName) {
    state.businessName = extractedName;
  }

  // Detect niche
  const nicheScores = detectNiche(input);
  const topNiche = nicheScores[0];

  if (topNiche && topNiche.confidence >= 0.25) {
    // High confidence - move to echo confirmation
    state.niche = topNiche.niche;
    state.nicheConfidence = topNiche.confidence;
    state.industry = getIndustryFromNiche(topNiche.niche);
    state.currentStage = STAGES.ECHO_CONFIRMATION;

    const nicheLabel = formatNicheLabel(topNiche.niche);
    const message = state.businessName
      ? `Got it! So ${state.businessName} is ${nicheLabel}. Is that right?`
      : `So you run ${nicheLabel}. Is that right?`;

    return {
      message,
      buttons: [
        { label: 'Yes, that\'s right', value: 'yes' },
        { label: 'Not quite', value: 'no' },
      ],
      stage: STAGES.ECHO_CONFIRMATION,
      completed: false,
      state,
    };
  } else {
    // Low confidence - ask for clarification
    state.currentStage = STAGES.NICHE_DETECTION;
    return {
      message: 'Thanks! What type of business would you say this is?',
      buttons: [
        { label: 'Healthcare/Medical', value: 'medical_practice' },
        { label: 'Retail Store', value: 'boutique_retail' },
        { label: 'Restaurant/Food', value: 'restaurant' },
        { label: 'Software/SaaS', value: 'saas_product' },
        { label: 'Local Services', value: 'home_services' },
        { label: 'Other', value: 'generic' },
      ],
      stage: STAGES.NICHE_DETECTION,
      completed: false,
      state,
    };
  }
}

/**
 * Stage 2: Handle echo confirmation
 */
function handleEchoConfirmation(input: string, state: OnboardingState): OnboardingResponse {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('yes') || lowerInput === 'yes') {
    // Confirmed - move to niche deepening
    state.currentStage = STAGES.NICHE_DEEPENING;

    // Ask for business name if not extracted
    if (!state.businessName) {
      return {
        message: "Perfect! What's your business called?",
        stage: STAGES.ECHO_CONFIRMATION,
        completed: false,
        state,
      };
    }

    // Start niche-specific questions
    return startNicheDeepening(state);
  } else {
    // User disagrees - ask for correction
    return {
      message: "No problem! Tell me more about your business so I can understand it better.",
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state: { ...state, currentStage: STAGES.INITIAL_INPUT },
    };
  }
}

/**
 * Stage 3: Handle niche detection (manual selection)
 */
function handleNicheDetection(input: string, state: OnboardingState): OnboardingResponse {
  // Input should be a niche selection
  state.niche = input as NicheType;
  state.industry = getIndustryFromNiche(state.niche);
  state.nicheConfidence = 1.0; // User manually selected
  state.currentStage = STAGES.NICHE_DEEPENING;

  return startNicheDeepening(state);
}

/**
 * Start niche-specific deepening questions
 */
function startNicheDeepening(state: OnboardingState): OnboardingResponse {
  if (!state.niche) {
    return {
      message: 'Something went wrong. Let\'s start over.',
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state,
    };
  }

  const questions = getNicheQuestions(state.niche);

  if (questions.length === 0) {
    // No niche-specific questions, skip to scope definition
    return startScopeDefinition(state);
  }

  const firstQuestion = questions[0];
  state.currentStage = STAGES.NICHE_DEEPENING;
  state.nicheData = state.nicheData || {};

  return {
    message: firstQuestion.question,
    question: firstQuestion,
    buttons: firstQuestion.options,
    stage: STAGES.NICHE_DEEPENING,
    completed: false,
    state,
  };
}

/**
 * Stage 4: Handle niche deepening questions
 */
function handleNicheDeepening(input: string, state: OnboardingState): OnboardingResponse {
  if (!state.niche) {
    return {
      message: 'Something went wrong. Let\'s start over.',
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state,
    };
  }

  const lowerInput = input.toLowerCase();

  // Initialize nicheData if not exists
  if (!state.nicheData) {
    state.nicheData = {};
  }

  const questions = getNicheQuestions(state.niche);

  // Initialize tracking arrays
  if (!(state.nicheData as any).answeredQuestions) {
    (state.nicheData as any).answeredQuestions = [];
  }
  if (!(state.nicheData as any).answeredQuestionIds) {
    (state.nicheData as any).answeredQuestionIds = [];
  }

  const answeredIds = (state.nicheData as any).answeredQuestionIds as string[];

  // Capture business name if not set yet (Quick Start flow asks for name first)
  if (state.niche && !state.businessName && answeredIds.length === 0) {
    state.businessName = input;
    return startNicheDeepening(state);
  }

  // Handle skip/don't know
  if (lowerInput.includes("skip") || lowerInput.includes("don't know") || lowerInput.includes("not sure") || lowerInput === "idk") {
    if (!state.fieldsSkippedByUser) {
      state.fieldsSkippedByUser = [];
    }

    // Find current question (first unanswered, non-skipped question)
    const currentQuestion = questions.find(q =>
      !answeredIds.includes(q.id) && !shouldSkipQuestion(q, state)
    );

    if (currentQuestion) {
      state.fieldsSkippedByUser.push(currentQuestion.id);
      answeredIds.push(currentQuestion.id);
    }

    // Find next question
    const nextQuestion = findNextQuestion(questions, answeredIds, state);
    if (nextQuestion) {
      return {
        message: "No problem! Let's move on. " + nextQuestion.question,
        question: nextQuestion,
        buttons: nextQuestion.options,
        stage: STAGES.NICHE_DEEPENING,
        completed: false,
        state,
      };
    } else {
      return startScopeDefinition(state);
    }
  }

  // Find current question being answered
  const currentQuestion = questions.find(q =>
    !answeredIds.includes(q.id) && !shouldSkipQuestion(q, state)
  );

  if (currentQuestion) {
    // Store the answer with question ID
    (state.nicheData as any)[currentQuestion.id] = input;
    (state.nicheData as any).answeredQuestions.push({
      question: currentQuestion.id,
      answer: input,
    });
    answeredIds.push(currentQuestion.id);
  }

  // Find next question (respecting skip conditions which may have changed based on answer)
  const nextQuestion = findNextQuestion(questions, answeredIds, state);

  if (nextQuestion) {
    return {
      message: nextQuestion.question,
      question: nextQuestion,
      buttons: nextQuestion.options,
      stage: STAGES.NICHE_DEEPENING,
      completed: false,
      state,
    };
  }

  // All questions answered, move to scope definition
  return startScopeDefinition(state);
}

/**
 * Find the next unanswered question that shouldn't be skipped
 */
function findNextQuestion(
  questions: OnboardingQuestion[],
  answeredIds: string[],
  state: OnboardingState
): OnboardingQuestion | null {
  for (const question of questions) {
    if (!answeredIds.includes(question.id) && !shouldSkipQuestion(question, state)) {
      return question;
    }
  }
  return null;
}

/**
 * Start scope definition stage
 */
function startScopeDefinition(state: OnboardingState): OnboardingResponse {
  state.currentStage = STAGES.SCOPE_DEFINITION;

  if (!state.niche) {
    return {
      message: 'Something went wrong.',
      stage: STAGES.INITIAL_INPUT,
      completed: false,
      state,
    };
  }

  const defaultCapabilities = getDefaultCapabilities(state.niche);
  state.agentCapabilities = defaultCapabilities;

  return {
    message: 'What should your AI Front Desk be able to do?',
    buttons: [
      { label: 'Answer customer questions', value: 'answer_questions' },
      { label: 'Take bookings/appointments', value: 'take_bookings' },
      { label: 'Process orders', value: 'process_orders' },
      { label: 'Collect leads', value: 'collect_leads' },
      { label: 'Do everything (Recommended)', value: 'all' },
    ],
    stage: STAGES.SCOPE_DEFINITION,
    completed: false,
    state,
  };
}

/**
 * Stage 5: Handle scope definition
 */
function handleScopeDefinition(input: string, state: OnboardingState): OnboardingResponse {
  const lowerInput = input.toLowerCase();

  // Handle capability selection
  if (input === 'all' && !state.agentCapabilities) {
    state.agentCapabilities = state.niche ? getDefaultCapabilities(state.niche) : ['answer_questions'];
  }

  // Store escalation strategy if it's being answered
  if (!state.escalationStrategy && state.agentCapabilities) {
    // User is answering the escalation question
    if (lowerInput === 'human_handoff' || lowerInput === 'full_auto' ||
        lowerInput === 'collect_and_notify' || lowerInput === 'faq_only') {
      state.escalationStrategy = input as any;
    }
  }

  // Ask about escalation if not set yet and capabilities are set
  if (!state.escalationStrategy && state.agentCapabilities) {
    state.currentStage = STAGES.SCOPE_DEFINITION;
    return {
      message: "When the AI can't help a customer, what should happen?",
      buttons: [
        { label: 'Hand off to a human (Recommended)', value: 'human_handoff' },
        { label: 'AI handles everything', value: 'full_auto' },
        { label: 'Collect info and notify me later', value: 'collect_and_notify' },
        { label: 'Only answer known questions', value: 'faq_only' },
      ],
      stage: STAGES.SCOPE_DEFINITION,
      completed: false,
      state,
    };
  }

  // If human handoff, ask for contact
  if (state.escalationStrategy === 'human_handoff' && !state.handoffContact) {
    return {
      message: 'Great! What email should I use for handoffs?',
      stage: STAGES.SCOPE_DEFINITION,
      completed: false,
      state,
    };
  }

  // Move to knowledge sources
  return startKnowledgeSources(state);
}

/**
 * Start knowledge sources stage
 */
function startKnowledgeSources(state: OnboardingState): OnboardingResponse {
  state.currentStage = STAGES.KNOWLEDGE_SOURCES;

  return {
    message: 'Where should your AI learn from? (Select all that apply)',
    buttons: [
      { label: '📄 Website', value: 'website' },
      { label: '📚 Documents', value: 'documents' },
      { label: '❓ FAQ', value: 'faq' },
      { label: '🛍️ Products', value: 'products' },
      { label: '💾 Database', value: 'database' },
      { label: 'Skip for now', value: 'skip' },
    ],
    stage: STAGES.KNOWLEDGE_SOURCES,
    completed: false,
    state,
  };
}

/**
 * Stage 6: Handle knowledge sources
 */
function handleKnowledgeSources(input: string, state: OnboardingState): OnboardingResponse {
  if (input === 'skip') {
    state.knowledgeSources = [];
    return startToneConfig(state);
  }

  // Store knowledge source selection (simplified)
  state.knowledgeSources = state.knowledgeSources || [];

  // Move to tone config
  return startToneConfig(state);
}

/**
 * Start tone configuration
 */
function startToneConfig(state: OnboardingState): OnboardingResponse {
  state.currentStage = STAGES.TONE_CONFIG;

  const defaultTone = state.niche ? getDefaultTone(state.niche) : 'friendly';
  state.tone = defaultTone;

  return {
    message: 'How should your AI sound?',
    buttons: [
      { label: 'Friendly & Warm', value: 'friendly', description: 'Casual, approachable tone' },
      { label: 'Professional', value: 'professional', description: 'Formal and polished' },
      { label: 'Helpful & Eager', value: 'helpful', description: 'Solution-focused' },
      { label: 'Concise & Direct', value: 'concise', description: 'Brief, to-the-point' },
    ],
    stage: STAGES.TONE_CONFIG,
    completed: false,
    state,
  };
}

/**
 * Stage 7: Handle tone config
 */
function handleToneConfig(input: string, state: OnboardingState): OnboardingResponse {
  state.tone = input as any;
  state.currentStage = STAGES.FINAL_CONFIRMATION;
  state.onboardingCompleted = true;

  return {
    message: 'Perfect! Your AI Front Desk is ready to be created.',
    stage: STAGES.FINAL_CONFIRMATION,
    completed: true,
    state,
  };
}

/**
 * Format niche label for display
 */
function formatNicheLabel(niche: NicheType): string {
  const labels: Record<NicheType, string> = {
    dental_clinic: 'a dental practice',
    medical_practice: 'a medical practice',
    therapy_practice: 'a therapy practice',
    boutique_retail: 'a retail store',
    ecommerce_store: 'an e-commerce store',
    restaurant: 'a restaurant',
    salon_spa: 'a salon or spa',
    gym_fitness: 'a gym or fitness center',
    saas_product: 'a SaaS product',
    consulting_firm: 'a consulting firm',
    law_office: 'a law office',
    real_estate_agency: 'a real estate agency',
    hotel_hospitality: 'a hotel or hospitality business',
    auto_dealership: 'an auto dealership',
    home_services: 'a home services business',
    tutoring_education: 'a tutoring or education business',
    generic: 'a business',
  };

  return labels[niche] || 'a business';
}

/**
 * Initialize new onboarding state
 */
export function initializeOnboarding(): OnboardingState {
  return {
    businessDescription: '',
    currentStage: STAGES.INITIAL_INPUT,
    rawInputs: [],
    language: 'en',
    responseStyle: 'concise',
    onboardingCompleted: false,
    fieldsSkippedByUser: [],
  };
}
