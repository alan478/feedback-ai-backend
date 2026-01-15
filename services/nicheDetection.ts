import type {
  NicheType,
  IndustryType,
  NicheScore,
  NicheDetectionSignals,
} from '../types/onboarding';

// Keyword dictionaries for each niche
const NICHE_KEYWORDS: Record<NicheType, string[]> = {
  dental_clinic: ['dental', 'dentist', 'teeth', 'cleaning', 'implants', 'orthodontics', 'braces', 'cavity'],
  medical_practice: ['clinic', 'patients', 'appointments', 'medical', 'doctor', 'healthcare', 'diagnosis', 'treatment'],
  therapy_practice: ['therapy', 'therapist', 'counseling', 'mental health', 'sessions', 'psychologist'],
  boutique_retail: ['boutique', 'shop', 'store', 'clothing', 'fashion', 'apparel', 'handmade', 'curated'],
  ecommerce_store: ['online store', 'ecommerce', 'sell online', 'shipping', 'shopify', 'marketplace'],
  restaurant: ['restaurant', 'menu', 'reservations', 'dining', 'food', 'chef', 'cuisine', 'kitchen'],
  salon_spa: ['salon', 'spa', 'hair', 'nails', 'massage', 'beauty', 'stylist', 'manicure'],
  gym_fitness: ['gym', 'fitness', 'workout', 'training', 'personal trainer', 'classes', 'memberships'],
  saas_product: ['saas', 'software', 'platform', 'app', 'subscription', 'users', 'dashboard', 'api'],
  consulting_firm: ['consulting', 'consultant', 'advisory', 'strategy', 'business consulting'],
  law_office: ['law', 'legal', 'attorney', 'lawyer', 'cases', 'litigation', 'contracts'],
  real_estate_agency: ['real estate', 'properties', 'listings', 'buyers', 'sellers', 'agents', 'homes'],
  hotel_hospitality: ['hotel', 'motel', 'inn', 'resort', 'rooms', 'booking', 'hospitality', 'guests'],
  auto_dealership: ['car', 'dealership', 'vehicles', 'automotive', 'sales', 'test drive'],
  home_services: ['plumbing', 'electrical', 'hvac', 'handyman', 'repair', 'contractor', 'home services'],
  tutoring_education: ['tutoring', 'education', 'teaching', 'students', 'lessons', 'learning', 'academic'],
  generic: [],
};

// Workflow indicators
const WORKFLOW_KEYWORDS = {
  appointment_based: ['appointments', 'bookings', 'schedule', 'availability', 'calendar', 'slots'],
  transaction_based: ['orders', 'purchases', 'checkout', 'cart', 'payment', 'buy'],
  information_based: ['questions', 'faq', 'support', 'help', 'information', 'inquiries'],
  lead_based: ['inquiries', 'quotes', 'estimates', 'contact', 'leads', 'consultation'],
};

// Customer type indicators
const CUSTOMER_TYPE_KEYWORDS = {
  b2c: ['customers', 'shoppers', 'guests', 'patients', 'clients', 'people', 'individuals'],
  b2b: ['businesses', 'companies', 'teams', 'enterprises', 'organizations'],
};

// Scale indicators
const SCALE_KEYWORDS = {
  solo_small: ['i', 'my', 'just me', 'small', 'solo', 'freelance'],
  medium: ['team', 'staff', 'employees', 'we have', 'our team'],
  enterprise: ['company', 'corporation', 'locations', 'departments', 'branches'],
};

/**
 * Detects the niche of a business based on input text
 */
export function detectNiche(input: string): NicheScore[] {
  const lowerInput = input.toLowerCase();
  const scores: NicheScore[] = [];

  // Score each niche
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (niche === 'generic') continue;

    const signals = calculateSignals(lowerInput, keywords);
    const confidence = calculateConfidence(signals);

    scores.push({
      niche: niche as NicheType,
      confidence,
      signals,
    });
  }

  // Sort by confidence (highest first)
  scores.sort((a, b) => b.confidence - a.confidence);

  return scores;
}

/**
 * Calculate detection signals for a niche
 */
function calculateSignals(input: string, nicheKeywords: string[]): NicheDetectionSignals {
  // Keyword signal (0-0.4)
  const keywordMatches = nicheKeywords.filter(keyword =>
    input.includes(keyword)
  ).length;
  // Give higher score for even one keyword match
  const keywordScore = keywordMatches > 0 ? Math.min(keywordMatches / 2, 1) * 0.4 : 0;

  // Workflow signal (0-0.3)
  let workflowScore = 0;
  for (const [_, keywords] of Object.entries(WORKFLOW_KEYWORDS)) {
    const matches = keywords.filter(kw => input.includes(kw)).length;
    workflowScore = Math.max(workflowScore, Math.min(matches / 1.5, 1) * 0.3);
  }

  // Customer type signal (0-0.2)
  let customerTypeScore = 0;
  for (const [_, keywords] of Object.entries(CUSTOMER_TYPE_KEYWORDS)) {
    const matches = keywords.filter(kw => input.includes(kw)).length;
    customerTypeScore = Math.max(customerTypeScore, Math.min(matches / 1.5, 1) * 0.2);
  }

  // Contextual signal (0-0.1) - based on input length and structure
  const contextualScore = input.length > 30 ? 0.1 : input.length / 300;

  return {
    keyword: keywordScore,
    workflow: workflowScore,
    customerType: customerTypeScore,
    contextual: contextualScore,
  };
}

/**
 * Calculate overall confidence from signals
 */
function calculateConfidence(signals: NicheDetectionSignals): number {
  return (
    signals.keyword +
    signals.workflow +
    signals.customerType +
    signals.contextual
  );
}

/**
 * Extract industry from niche
 */
export function getIndustryFromNiche(niche: NicheType): IndustryType {
  const nicheToIndustry: Record<NicheType, IndustryType> = {
    dental_clinic: 'healthcare',
    medical_practice: 'healthcare',
    therapy_practice: 'healthcare',
    boutique_retail: 'retail',
    ecommerce_store: 'ecommerce',
    restaurant: 'food_beverage',
    salon_spa: 'beauty',
    gym_fitness: 'fitness',
    saas_product: 'saas',
    consulting_firm: 'professional_services',
    law_office: 'legal',
    real_estate_agency: 'real_estate',
    hotel_hospitality: 'hospitality',
    auto_dealership: 'automotive',
    home_services: 'local_services',
    tutoring_education: 'education',
    generic: 'other',
  };

  return nicheToIndustry[niche] || 'other';
}

/**
 * Extract business name from input
 */
export function extractBusinessName(input: string): string | undefined {
  // Look for patterns like "I run X", "My business is X", "X clinic", etc.
  const patterns = [
    /(?:i run|i have|i own|my business is|we are)\s+([A-Z][A-Za-z\s&'-]+?)(?:\.|,|$|\s+(?:that|which|where|and))/i,
    /([A-Z][A-Za-z\s&'-]+?)\s+(?:clinic|dental|salon|spa|gym|restaurant|cafe|shop|store|boutique|law|consulting)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Determine if multiple niches are detected
 */
export function isMultiNiche(scores: NicheScore[]): boolean {
  if (scores.length < 2) return false;
  return scores[0].confidence > 0.5 && scores[1].confidence > 0.5;
}

/**
 * Get confidence threshold action
 */
export function getConfidenceAction(confidence: number): 'auto' | 'soft_confirm' | 'clarify' | 'ask' {
  if (confidence >= 0.85) return 'auto';
  if (confidence >= 0.70) return 'soft_confirm';
  if (confidence >= 0.50) return 'clarify';
  return 'ask';
}
