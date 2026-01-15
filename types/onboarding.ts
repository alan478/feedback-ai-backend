// Onboarding Type Definitions for AI Front Desk

export type IndustryType =
  | 'healthcare' | 'retail' | 'saas' | 'local_services'
  | 'education' | 'finance' | 'hospitality' | 'professional_services'
  | 'ecommerce' | 'real_estate' | 'fitness' | 'beauty'
  | 'food_beverage' | 'automotive' | 'legal' | 'other';

export type NicheType =
  | 'dental_clinic' | 'medical_practice' | 'therapy_practice'
  | 'boutique_retail' | 'ecommerce_store' | 'restaurant'
  | 'salon_spa' | 'gym_fitness' | 'saas_product'
  | 'consulting_firm' | 'law_office' | 'real_estate_agency'
  | 'hotel_hospitality' | 'auto_dealership' | 'home_services'
  | 'tutoring_education' | 'generic';

export type AgentCapability =
  | 'answer_questions' | 'take_bookings' | 'process_orders'
  | 'provide_quotes' | 'collect_leads' | 'give_recommendations'
  | 'handle_complaints' | 'check_availability' | 'track_orders';

export type EscalationStrategy =
  | 'full_auto'          // AI handles everything
  | 'human_handoff'      // Transfer to human when stuck
  | 'faq_only'           // Only answer known questions
  | 'collect_and_notify'; // Collect info, notify human later

export type TonePreset =
  | 'friendly'      // Warm, casual
  | 'professional'  // Formal, polished
  | 'helpful'       // Eager, solution-focused
  | 'concise'       // Brief, to-the-point
  | 'custom';       // User-defined

export type BusinessSize = 'solo' | 'small' | 'medium' | 'enterprise';

export interface KnowledgeSource {
  type: 'website' | 'documents' | 'faq' | 'products' | 'database' | 'api' | 'manual';
  url?: string;
  count?: number;
  catalogSize?: number;
  connectionType?: string;
  endpoint?: string;
}

export interface NicheSpecificData {
  dental?: {
    services: string[];
    acceptsInsurance: boolean;
    emergencyHours: boolean;
    bookingLeadTime: string;
  };

  retail?: {
    productCategories: string[];
    priceRange: string;
    returnsPolicy: string;
    shippingOptions: string[];
  };

  saas?: {
    productType: string;
    pricingModel: 'free' | 'freemium' | 'paid' | 'enterprise';
    hasFreeTrial: boolean;
    supportTiers: string[];
  };

  localServices?: {
    serviceArea: string;
    serviceTypes: string[];
    estimateProcess: string;
    licensingInfo?: string;
  };

  hospitality?: {
    propertyType: string;
    roomTypes?: string[];
    amenities: string[];
    checkInOut: { in: string; out: string };
    bookingPlatforms: string[];
  };

  restaurant?: {
    cuisineType: string;
    diningOptions: string[];
    reservationSystem: boolean;
    menuHighlights: string[];
    dietaryOptions: string[];
  };
}

export interface OnboardingState {
  // Core Identity (Required)
  businessName?: string;
  businessDescription: string;
  industry?: IndustryType;
  niche?: NicheType;
  nicheConfidence?: number;

  // Business Context
  targetCustomers?: string;
  primaryServices?: string[];
  businessSize?: BusinessSize;

  // Agent Configuration
  agentCapabilities?: AgentCapability[];
  escalationStrategy?: EscalationStrategy;
  handoffContact?: string;

  // Knowledge
  knowledgeSources?: KnowledgeSource[];
  websiteUrl?: string;

  // Behavior
  tone?: TonePreset;
  language?: string;
  responseStyle?: 'concise' | 'detailed';

  // Niche-Specific
  nicheData?: NicheSpecificData;

  // Metadata
  createdAt?: Date;
  onboardingCompleted?: boolean;
  rawInputs?: string[];
  currentStage?: number;
  fieldsSkippedByUser?: string[];
}

export interface NicheDetectionSignals {
  keyword: number;       // 0-0.4 weight
  workflow: number;      // 0-0.3 weight
  customerType: number;  // 0-0.2 weight
  contextual: number;    // 0-0.1 weight
}

export interface NicheScore {
  niche: NicheType;
  confidence: number;
  signals: NicheDetectionSignals;
}

export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multi-select' | 'buttons' | 'confirmation';
  options?: QuestionOption[];
  field: keyof OnboardingState;
  required: boolean;
  skipCondition?: (state: OnboardingState) => boolean;
}

export interface OnboardingResponse {
  message: string;
  question?: OnboardingQuestion;
  buttons?: QuestionOption[];
  stage: number;
  completed: boolean;
  state: OnboardingState;
}
