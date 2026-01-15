import type { OnboardingState, OnboardingResponse } from '../types/onboarding';
import { extractStructuredData } from './llmExtractor';

/**
 * OPTIMIZED ONBOARDING SERVICE
 *
 * Uses a single LLM call per turn to:
 * 1. Extract all possible fields from user input
 * 2. Identify what's still missing
 * 3. Generate next 1-2 questions
 *
 * This keeps total calls to 3-6 instead of 30+
 */

/**
 * Process user input - OPTIMIZED VERSION
 * Single call extracts everything and generates next questions
 */
export async function processOnboardingInputOptimized(
  input: string,
  state: OnboardingState
): Promise<OnboardingResponse> {
  // Handle restart edge case
  if (input.toLowerCase().includes('start over') || input.toLowerCase().includes('restart')) {
    return {
      message: "No problem! Let's start fresh. Tell me about your business in a sentence or two.",
      stage: 0,
      completed: false,
      state: initializeOnboarding(),
    };
  }

  // Single LLM call to extract everything
  const extraction = await extractStructuredData(input, state);

  // Update state with extracted fields
  const updatedState: OnboardingState = {
    ...state,
    ...extraction.updatedFields,
    rawInputs: [...(state.rawInputs || []), input],
  };

  // Check if onboarding is complete
  const isComplete = extraction.missingFields.length === 0;

  if (isComplete) {
    updatedState.onboardingCompleted = true;
    return {
      message: "Perfect! Your AI Front Desk is ready to be created. Review your configuration and let's launch it!",
      stage: 999, // Completion stage
      completed: true,
      state: updatedState,
    };
  }

  // Generate response with next question(s)
  const nextQuestion = extraction.nextQuestions[0];

  if (!nextQuestion) {
    // Fallback - shouldn't happen
    return {
      message: "Tell me more about your business.",
      stage: state.currentStage || 0,
      completed: false,
      state: updatedState,
    };
  }

  // Format buttons if provided
  const buttons = nextQuestion.options
    ? nextQuestion.options.map((opt) => ({
        label: opt,
        value: opt.toLowerCase().replace(/\s+/g, '_'),
      }))
    : undefined;

  return {
    message: nextQuestion.question,
    buttons,
    stage: (state.currentStage || 0) + 1,
    completed: false,
    state: updatedState,
  };
}

/**
 * Initialize new onboarding state
 */
export function initializeOnboarding(): OnboardingState {
  return {
    businessDescription: '',
    currentStage: 0,
    rawInputs: [],
    language: 'en',
    responseStyle: 'concise',
    onboardingCompleted: false,
    fieldsSkippedByUser: [],
  };
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(state: OnboardingState): number {
  const requiredFields = [
    'businessName',
    'niche',
    'businessDescription',
    'agentCapabilities',
    'escalationStrategy',
    'tone',
  ];

  const completedFields = requiredFields.filter((field) => {
    const value = state[field as keyof OnboardingState];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}
