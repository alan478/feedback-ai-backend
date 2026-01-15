import type {
  NicheType,
  OnboardingQuestion,
  OnboardingState,
  AgentCapability,
  TonePreset,
} from '../types/onboarding';

/**
 * Get niche-specific questions based on detected niche
 */
export function getNicheQuestions(niche: NicheType): OnboardingQuestion[] {
  const strategies: Record<NicheType, OnboardingQuestion[]> = {
    dental_clinic: [
      {
        id: 'dental_services',
        question: 'What services does your practice offer?',
        type: 'multi-select',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Cleanings & Preventive Care', value: 'cleanings' },
          { label: 'Fillings & Restorations', value: 'fillings' },
          { label: 'Cosmetic Dentistry', value: 'cosmetic' },
          { label: 'Implants', value: 'implants' },
          { label: 'Orthodontics', value: 'orthodontics' },
          { label: 'Emergency Dental', value: 'emergency' },
        ],
      },
      {
        id: 'dental_insurance',
        question: 'Do you accept dental insurance?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Yes, most plans', value: 'yes' },
          { label: 'Some plans only', value: 'some' },
          { label: 'No', value: 'no' },
        ],
      },
      {
        id: 'dental_emergency',
        question: 'Do you handle dental emergencies?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Yes, 24/7', value: 'yes_24_7' },
          { label: 'Yes, during business hours', value: 'yes_business' },
          { label: 'No', value: 'no' },
        ],
      },
      {
        id: 'dental_booking_leadtime',
        question: "What's the typical lead time for appointments?",
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Same-day available', value: 'same_day' },
          { label: '24-48 hours', value: '24_48_hours' },
          { label: '1 week', value: '1_week' },
          { label: '2+ weeks', value: '2_weeks_plus' },
        ],
      },
    ],

    medical_practice: [
      {
        id: 'medical_specialty',
        question: 'What type of medical practice is this?',
        type: 'select',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'General Practice / Family Medicine', value: 'general' },
          { label: 'Pediatrics', value: 'pediatrics' },
          { label: 'Internal Medicine', value: 'internal' },
          { label: 'Dermatology', value: 'dermatology' },
          { label: 'Cardiology', value: 'cardiology' },
          { label: 'Other Specialty', value: 'other' },
        ],
      },
      {
        id: 'medical_insurance',
        question: 'Do you accept insurance?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'Some plans', value: 'some' },
          { label: 'No', value: 'no' },
        ],
      },
    ],

    boutique_retail: [
      {
        id: 'retail_products',
        question: 'What types of products do you sell?',
        type: 'text',
        field: 'primaryServices',
        required: true,
      },
      {
        id: 'retail_price_range',
        question: 'How would you describe your price range?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Budget-friendly', value: 'budget' },
          { label: 'Mid-range', value: 'mid' },
          { label: 'Premium', value: 'premium' },
          { label: 'Luxury', value: 'luxury' },
        ],
      },
      {
        id: 'retail_returns',
        question: "What's your return policy?",
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: '30-day returns', value: '30_day' },
          { label: '14-day returns', value: '14_day' },
          { label: 'Store credit only', value: 'store_credit' },
          { label: 'No returns', value: 'no_returns' },
        ],
      },
      {
        id: 'retail_shipping',
        question: 'Do you offer shipping?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Yes, worldwide', value: 'worldwide' },
          { label: 'Yes, domestic only', value: 'domestic' },
          { label: 'Local delivery only', value: 'local' },
          { label: 'In-store pickup only', value: 'pickup' },
        ],
      },
    ],

    saas_product: [
      {
        id: 'saas_product_type',
        question: 'What does your software help people do?',
        type: 'text',
        field: 'businessDescription',
        required: true,
      },
      {
        id: 'saas_pricing',
        question: "What's your pricing model?",
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Freemium', value: 'freemium' },
          { label: 'Subscription', value: 'paid' },
          { label: 'Enterprise', value: 'enterprise' },
        ],
      },
      {
        id: 'saas_trial',
        question: 'Do you offer a free trial?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Yes, 7 days', value: '7_days' },
          { label: 'Yes, 14 days', value: '14_days' },
          { label: 'Yes, 30 days', value: '30_days' },
          { label: 'No trial', value: 'no' },
        ],
      },
      {
        id: 'saas_support',
        question: 'What support do you provide?',
        type: 'multi-select',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Self-serve documentation', value: 'docs' },
          { label: 'Email support', value: 'email' },
          { label: 'Live chat', value: 'chat' },
          { label: 'Dedicated account manager', value: 'dedicated' },
        ],
      },
    ],

    home_services: [
      {
        id: 'home_services_area',
        question: 'What area do you serve?',
        type: 'text',
        field: 'nicheData',
        required: true,
      },
      {
        id: 'home_services_types',
        question: 'What services do you provide?',
        type: 'text',
        field: 'primaryServices',
        required: true,
      },
      {
        id: 'home_services_estimates',
        question: 'How do you provide estimates?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Free estimates', value: 'free' },
          { label: 'On-site required', value: 'onsite' },
          { label: 'Via photos/remote', value: 'remote' },
          { label: 'Flat rate pricing', value: 'flat' },
        ],
      },
      {
        id: 'home_services_emergency',
        question: 'Do you offer emergency services?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Yes, 24/7', value: 'yes_24_7' },
          { label: 'Yes, limited hours', value: 'yes_limited' },
          { label: 'No', value: 'no' },
        ],
      },
    ],

    restaurant: [
      {
        id: 'restaurant_cuisine',
        question: 'What type of cuisine do you serve?',
        type: 'text',
        field: 'nicheData',
        required: true,
      },
      {
        id: 'restaurant_dining_options',
        question: 'What dining options do you offer?',
        type: 'multi-select',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Dine-in', value: 'dine_in' },
          { label: 'Takeout', value: 'takeout' },
          { label: 'Delivery', value: 'delivery' },
          { label: 'Catering', value: 'catering' },
        ],
      },
      {
        id: 'restaurant_reservations',
        question: 'Do you take reservations?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Yes, online', value: 'yes_online' },
          { label: 'Yes, phone only', value: 'yes_phone' },
          { label: 'Walk-in only', value: 'walk_in' },
        ],
      },
      {
        id: 'restaurant_dietary',
        question: 'Any dietary options?',
        type: 'multi-select',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Vegetarian', value: 'vegetarian' },
          { label: 'Vegan', value: 'vegan' },
          { label: 'Gluten-free', value: 'gluten_free' },
          { label: 'Halal', value: 'halal' },
          { label: 'Kosher', value: 'kosher' },
        ],
      },
    ],

    salon_spa: [
      {
        id: 'salon_services',
        question: 'What services do you offer?',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Hair styling', value: 'hair' },
          { label: 'Nails', value: 'nails' },
          { label: 'Massage', value: 'massage' },
          { label: 'Facials', value: 'facials' },
          { label: 'Waxing', value: 'waxing' },
          { label: 'Spa packages', value: 'packages' },
        ],
      },
      {
        id: 'salon_booking',
        question: 'How do clients book?',
        type: 'buttons',
        field: 'nicheData',
        required: false,
        options: [
          { label: 'Online booking', value: 'online' },
          { label: 'Phone only', value: 'phone' },
          { label: 'Walk-ins welcome', value: 'walk_in' },
        ],
      },
    ],

    gym_fitness: [
      {
        id: 'gym_services',
        question: 'What do you offer?',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Gym memberships', value: 'memberships' },
          { label: 'Personal training', value: 'personal_training' },
          { label: 'Group classes', value: 'classes' },
          { label: 'Nutrition coaching', value: 'nutrition' },
        ],
      },
    ],

    ecommerce_store: [
      {
        id: 'ecommerce_products',
        question: 'What do you sell?',
        type: 'text',
        field: 'primaryServices',
        required: true,
      },
      {
        id: 'ecommerce_shipping',
        question: 'Where do you ship?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Worldwide', value: 'worldwide' },
          { label: 'Domestic only', value: 'domestic' },
          { label: 'Specific regions', value: 'regions' },
        ],
      },
    ],

    // Default for other niches
    therapy_practice: [],
    consulting_firm: [],
    law_office: [],
    real_estate_agency: [],
    hotel_hospitality: [],
    auto_dealership: [],
    tutoring_education: [],
    generic: [],
  };

  return strategies[niche] || [];
}

/**
 * Get default agent capabilities for a niche
 */
export function getDefaultCapabilities(niche: NicheType): AgentCapability[] {
  const defaults: Record<NicheType, AgentCapability[]> = {
    dental_clinic: ['answer_questions', 'take_bookings', 'check_availability'],
    medical_practice: ['answer_questions', 'take_bookings', 'check_availability'],
    therapy_practice: ['answer_questions', 'take_bookings'],
    boutique_retail: ['answer_questions', 'give_recommendations', 'process_orders'],
    ecommerce_store: ['answer_questions', 'process_orders', 'track_orders', 'give_recommendations'],
    restaurant: ['answer_questions', 'take_bookings', 'process_orders'],
    salon_spa: ['answer_questions', 'take_bookings', 'check_availability'],
    gym_fitness: ['answer_questions', 'take_bookings', 'collect_leads'],
    saas_product: ['answer_questions', 'collect_leads', 'provide_quotes'],
    consulting_firm: ['answer_questions', 'collect_leads', 'take_bookings'],
    law_office: ['answer_questions', 'collect_leads', 'take_bookings'],
    real_estate_agency: ['answer_questions', 'collect_leads', 'take_bookings'],
    hotel_hospitality: ['answer_questions', 'take_bookings', 'check_availability'],
    auto_dealership: ['answer_questions', 'collect_leads', 'take_bookings'],
    home_services: ['answer_questions', 'provide_quotes', 'take_bookings', 'collect_leads'],
    tutoring_education: ['answer_questions', 'take_bookings', 'collect_leads'],
    generic: ['answer_questions', 'collect_leads'],
  };

  return defaults[niche] || ['answer_questions'];
}

/**
 * Get default tone for a niche
 */
export function getDefaultTone(niche: NicheType): TonePreset {
  const defaults: Record<NicheType, TonePreset> = {
    dental_clinic: 'professional',
    medical_practice: 'professional',
    therapy_practice: 'helpful',
    boutique_retail: 'friendly',
    ecommerce_store: 'friendly',
    restaurant: 'friendly',
    salon_spa: 'friendly',
    gym_fitness: 'helpful',
    saas_product: 'helpful',
    consulting_firm: 'professional',
    law_office: 'professional',
    real_estate_agency: 'professional',
    hotel_hospitality: 'friendly',
    auto_dealership: 'helpful',
    home_services: 'helpful',
    tutoring_education: 'friendly',
    generic: 'friendly',
  };

  return defaults[niche] || 'friendly';
}

/**
 * Check if a question should be skipped based on state
 */
export function shouldSkipQuestion(
  question: OnboardingQuestion,
  state: OnboardingState
): boolean {
  if (question.skipCondition) {
    return question.skipCondition(state);
  }
  return false;
}
