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
        question: 'What services does your practice offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'General Checkups', value: 'general_checkups' },
          { label: 'Teeth Cleaning', value: 'teeth_cleaning' },
          { label: 'Fillings & Restorations', value: 'fillings_restorations' },
          { label: 'Root Canal Treatment', value: 'root_canal' },
          { label: 'Teeth Whitening', value: 'teeth_whitening' },
          { label: 'Dental Implants', value: 'dental_implants' },
          { label: 'Orthodontics/Braces', value: 'orthodontics' },
          { label: 'Crowns & Bridges', value: 'crowns_bridges' },
          { label: 'Gum Treatment', value: 'gum_treatment' },
          { label: 'Pediatric Dentistry', value: 'pediatric' },
          { label: 'Emergency Dental Care', value: 'emergency' },
          { label: 'Cosmetic Dentistry', value: 'cosmetic' },
        ],
      },
      {
        id: 'dental_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
      {
        id: 'dental_insurance',
        question: 'Do you accept dental insurance?',
        type: 'buttons',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        followUpQuestionId: 'dental_insurance_providers',
        followUpTriggerValues: ['yes'],
      },
      {
        id: 'dental_insurance_providers',
        question: 'Which insurance providers do you accept? (Select all that apply)',
        type: 'insurance-select',
        field: 'nicheData',
        required: true,
        options: [
          { label: 'Delta Dental', value: 'delta_dental' },
          { label: 'Cigna Dental', value: 'cigna' },
          { label: 'Aetna Dental', value: 'aetna' },
          { label: 'MetLife Dental', value: 'metlife' },
          { label: 'United Healthcare Dental', value: 'united_healthcare' },
          { label: 'Guardian Dental', value: 'guardian' },
          { label: 'Humana Dental', value: 'humana' },
          { label: 'Blue Cross Blue Shield', value: 'bcbs' },
          { label: 'Anthem Dental', value: 'anthem' },
          { label: 'Principal Dental', value: 'principal' },
          { label: 'Sun Life Dental', value: 'sun_life' },
          { label: 'Ameritas Dental', value: 'ameritas' },
        ],
        skipCondition: (state: OnboardingState) => {
          const nicheData = state.nicheData as any;
          return nicheData?.dental_insurance !== 'yes';
        },
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
        id: 'dental_clinic_hours',
        question: 'What are your clinic hours?',
        type: 'schedule',
        field: 'nicheData',
        required: true,
        options: [], // Schedule type doesn't use standard options
      },
    ],

    medical_practice: [
      {
        id: 'medical_services',
        question: 'What services does your practice offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'General Consultation', value: 'general_consultation' },
          { label: 'Annual Physical Exam', value: 'annual_physical' },
          { label: 'Vaccinations', value: 'vaccinations' },
          { label: 'Lab Work & Blood Tests', value: 'lab_work' },
          { label: 'Chronic Disease Management', value: 'chronic_disease' },
          { label: 'Prescription Management', value: 'prescription_mgmt' },
          { label: 'Minor Procedures', value: 'minor_procedures' },
          { label: 'Referral Services', value: 'referral_services' },
        ],
      },
      {
        id: 'medical_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
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
        id: 'retail_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'In-store Shopping', value: 'in_store' },
          { label: 'Personal Styling', value: 'personal_styling' },
          { label: 'Gift Wrapping', value: 'gift_wrapping' },
          { label: 'Alterations', value: 'alterations' },
          { label: 'Custom Orders', value: 'custom_orders' },
          { label: 'Loyalty Program', value: 'loyalty_program' },
          { label: 'Private Shopping Appointments', value: 'private_shopping' },
        ],
      },
      {
        id: 'retail_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
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
        id: 'saas_services',
        question: 'What do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Free Tier', value: 'free_tier' },
          { label: 'Pro Plan', value: 'pro_plan' },
          { label: 'Enterprise Plan', value: 'enterprise_plan' },
          { label: 'API Access', value: 'api_access' },
          { label: 'Custom Integrations', value: 'custom_integrations' },
          { label: 'Onboarding & Training', value: 'onboarding_training' },
          { label: 'Priority Support', value: 'priority_support' },
          { label: 'Data Migration', value: 'data_migration' },
        ],
      },
      {
        id: 'saas_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
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
        id: 'home_services_types',
        question: 'What services do you provide? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Plumbing', value: 'plumbing' },
          { label: 'Electrical', value: 'electrical' },
          { label: 'HVAC', value: 'hvac' },
          { label: 'Painting', value: 'painting' },
          { label: 'Landscaping', value: 'landscaping' },
          { label: 'Cleaning', value: 'cleaning' },
          { label: 'Roofing', value: 'roofing' },
          { label: 'Pest Control', value: 'pest_control' },
        ],
      },
      {
        id: 'home_services_custom',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
      {
        id: 'home_services_area',
        question: 'What area do you serve?',
        type: 'text',
        field: 'nicheData',
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
        id: 'restaurant_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Dine-in', value: 'dine_in' },
          { label: 'Takeout', value: 'takeout' },
          { label: 'Delivery', value: 'delivery' },
          { label: 'Catering', value: 'catering' },
          { label: 'Private Events', value: 'private_events' },
          { label: 'Reservations', value: 'reservations' },
        ],
      },
      {
        id: 'restaurant_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
      {
        id: 'restaurant_cuisine',
        question: 'What type of cuisine do you serve?',
        type: 'text',
        field: 'nicheData',
        required: true,
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
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Haircut & Styling', value: 'haircut_styling' },
          { label: 'Hair Coloring', value: 'hair_coloring' },
          { label: 'Manicure & Pedicure', value: 'manicure_pedicure' },
          { label: 'Facial Treatment', value: 'facial_treatment' },
          { label: 'Massage', value: 'massage' },
          { label: 'Waxing', value: 'waxing' },
          { label: 'Eyebrow Threading', value: 'eyebrow_threading' },
          { label: 'Keratin Treatment', value: 'keratin_treatment' },
        ],
      },
      {
        id: 'salon_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
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
        question: 'What do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Personal Training', value: 'personal_training' },
          { label: 'Group Classes', value: 'group_classes' },
          { label: 'Yoga', value: 'yoga' },
          { label: 'CrossFit', value: 'crossfit' },
          { label: 'Swimming', value: 'swimming' },
          { label: 'Nutrition Coaching', value: 'nutrition_coaching' },
          { label: 'Membership Plans', value: 'membership_plans' },
        ],
      },
      {
        id: 'gym_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    ecommerce_store: [
      {
        id: 'ecommerce_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Online Orders', value: 'online_orders' },
          { label: 'Subscriptions', value: 'subscriptions' },
          { label: 'Gift Cards', value: 'gift_cards' },
          { label: 'Express Shipping', value: 'express_shipping' },
          { label: 'International Shipping', value: 'international_shipping' },
          { label: 'Custom Orders', value: 'custom_orders' },
          { label: 'Returns & Exchanges', value: 'returns_exchanges' },
        ],
      },
      {
        id: 'ecommerce_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
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

    therapy_practice: [
      {
        id: 'therapy_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Individual Therapy', value: 'individual_therapy' },
          { label: 'Couples Therapy', value: 'couples_therapy' },
          { label: 'Family Therapy', value: 'family_therapy' },
          { label: 'Group Therapy', value: 'group_therapy' },
          { label: 'Cognitive Behavioral Therapy (CBT)', value: 'cbt' },
          { label: 'EMDR', value: 'emdr' },
          { label: 'Child & Adolescent Therapy', value: 'child_adolescent' },
          { label: 'Anxiety & Depression Treatment', value: 'anxiety_depression' },
          { label: 'Trauma Therapy', value: 'trauma_therapy' },
          { label: 'Substance Abuse Counseling', value: 'substance_abuse' },
        ],
      },
      {
        id: 'therapy_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    consulting_firm: [
      {
        id: 'consulting_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Strategy Consulting', value: 'strategy' },
          { label: 'Management Consulting', value: 'management' },
          { label: 'IT Consulting', value: 'it_consulting' },
          { label: 'Financial Advisory', value: 'financial_advisory' },
          { label: 'Marketing Consulting', value: 'marketing' },
          { label: 'HR Consulting', value: 'hr_consulting' },
          { label: 'Operations Consulting', value: 'operations' },
          { label: 'Risk & Compliance', value: 'risk_compliance' },
        ],
      },
      {
        id: 'consulting_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    law_office: [
      {
        id: 'law_services',
        question: 'What areas of law do you practice? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Corporate Law', value: 'corporate_law' },
          { label: 'Family Law', value: 'family_law' },
          { label: 'Criminal Defense', value: 'criminal_defense' },
          { label: 'Real Estate Law', value: 'real_estate_law' },
          { label: 'Estate Planning', value: 'estate_planning' },
          { label: 'Personal Injury', value: 'personal_injury' },
          { label: 'Immigration Law', value: 'immigration_law' },
          { label: 'Employment Law', value: 'employment_law' },
          { label: 'Intellectual Property', value: 'intellectual_property' },
        ],
      },
      {
        id: 'law_custom_services',
        question: 'Any other practice areas you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    real_estate_agency: [
      {
        id: 'real_estate_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Residential Sales', value: 'residential_sales' },
          { label: 'Commercial Sales', value: 'commercial_sales' },
          { label: 'Rental Properties', value: 'rental_properties' },
          { label: 'Property Management', value: 'property_management' },
          { label: 'Real Estate Appraisal', value: 'appraisal' },
          { label: 'Investment Advisory', value: 'investment_advisory' },
          { label: 'Relocation Services', value: 'relocation' },
        ],
      },
      {
        id: 'real_estate_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    hotel_hospitality: [
      {
        id: 'hotel_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'Room Reservations', value: 'room_reservations' },
          { label: 'Event & Conference Hosting', value: 'event_hosting' },
          { label: 'Restaurant & Dining', value: 'restaurant_dining' },
          { label: 'Spa & Wellness', value: 'spa_wellness' },
          { label: 'Airport Shuttle', value: 'airport_shuttle' },
          { label: 'Concierge Services', value: 'concierge' },
          { label: 'Room Service', value: 'room_service' },
          { label: 'Laundry & Dry Cleaning', value: 'laundry' },
        ],
      },
      {
        id: 'hotel_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    auto_dealership: [
      {
        id: 'auto_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'New Car Sales', value: 'new_car_sales' },
          { label: 'Used Car Sales', value: 'used_car_sales' },
          { label: 'Auto Financing', value: 'auto_financing' },
          { label: 'Vehicle Trade-ins', value: 'trade_ins' },
          { label: 'Service & Maintenance', value: 'service_maintenance' },
          { label: 'Parts Department', value: 'parts_department' },
          { label: 'Body Shop & Collision Repair', value: 'body_shop' },
          { label: 'Car Detailing', value: 'car_detailing' },
        ],
      },
      {
        id: 'auto_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    tutoring_education: [
      {
        id: 'tutoring_services',
        question: 'What services do you offer? (Select all that apply)',
        type: 'multi-select',
        field: 'primaryServices',
        required: true,
        options: [
          { label: 'One-on-One Tutoring', value: 'one_on_one' },
          { label: 'Group Classes', value: 'group_classes' },
          { label: 'Online Tutoring', value: 'online_tutoring' },
          { label: 'Test Prep (SAT/ACT/GRE)', value: 'test_prep' },
          { label: 'Homework Help', value: 'homework_help' },
          { label: 'Subject-Specific Tutoring', value: 'subject_specific' },
          { label: 'College Admissions Counseling', value: 'college_admissions' },
          { label: 'Study Skills Coaching', value: 'study_skills' },
        ],
      },
      {
        id: 'tutoring_custom_services',
        question: 'Any other services you\'d like to add? (Type them separated by commas, or say "skip")',
        type: 'text',
        field: 'primaryServices',
        required: false,
      },
    ],

    generic: [
      {
        id: 'generic_services',
        question: 'What services does your business provide? (Type them separated by commas)',
        type: 'text',
        field: 'primaryServices',
        required: true,
      },
    ],
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
