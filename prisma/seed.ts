import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type QuestionType = "single_select" | "multi_select" | "text" | "schedule";

interface SeedQuestion {
  questionId: string;
  question: string;
  type: QuestionType;
  options?: { label: string; value: string; description?: string }[];
  required: boolean;
  order: number;
  dependsOn?: { questionId: string; values: string[] };
}

const nicheQuestions: Record<string, SeedQuestion[]> = {
  dental_clinic: [
    {
      questionId: "business_name",
      question: "What's your dental practice called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "dental_services",
      question: "What services does your practice offer?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Cleanings & Preventive Care", value: "cleanings" },
        { label: "Fillings & Restorations", value: "fillings" },
        { label: "Cosmetic Dentistry", value: "cosmetic" },
        { label: "Implants", value: "implants" },
        { label: "Orthodontics", value: "orthodontics" },
        { label: "Emergency Dental", value: "emergency" },
        { label: "Root Canal Treatment", value: "root_canal" },
        { label: "Teeth Whitening", value: "whitening" },
        { label: "Pediatric Dentistry", value: "pediatric" },
      ],
    },
    {
      questionId: "dental_insurance",
      question: "Do you accept dental insurance?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      questionId: "dental_insurance_providers",
      question: "Which insurance providers do you accept?",
      type: "multi_select",
      required: false,
      order: 3,
      options: [
        { label: "Delta Dental", value: "delta_dental" },
        { label: "Cigna Dental", value: "cigna" },
        { label: "Aetna Dental", value: "aetna" },
        { label: "MetLife Dental", value: "metlife" },
        { label: "United Healthcare Dental", value: "united_healthcare" },
        { label: "Guardian Dental", value: "guardian" },
        { label: "Humana Dental", value: "humana" },
        { label: "Blue Cross Blue Shield", value: "bcbs" },
        { label: "Anthem Dental", value: "anthem" },
        { label: "Principal Dental", value: "principal" },
        { label: "Sun Life Dental", value: "sun_life" },
        { label: "Ameritas Dental", value: "ameritas" },
      ],
      dependsOn: { questionId: "dental_insurance", values: ["yes"] },
    },
    {
      questionId: "dental_emergency",
      question: "Do you handle dental emergencies?",
      type: "single_select",
      required: false,
      order: 4,
      options: [
        { label: "Yes, 24/7", value: "yes_24_7" },
        { label: "Yes, during business hours", value: "yes_business" },
        { label: "No", value: "no" },
      ],
    },
    {
      questionId: "dental_clinic_hours",
      question: "What are your clinic hours?",
      type: "schedule",
      required: false,
      order: 5,
    },
  ],

  medical_practice: [
    {
      questionId: "business_name",
      question: "What's your practice called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "medical_specialty",
      question: "What type of medical practice is this?",
      type: "single_select",
      required: false,
      order: 1,
      options: [
        { label: "General Practice / Family Medicine", value: "general" },
        { label: "Pediatrics", value: "pediatrics" },
        { label: "Internal Medicine", value: "internal" },
        { label: "Dermatology", value: "dermatology" },
        { label: "Cardiology", value: "cardiology" },
        { label: "Other Specialty", value: "other" },
      ],
    },
    {
      questionId: "medical_insurance",
      question: "Do you accept insurance?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Yes", value: "yes" },
        { label: "Some plans", value: "some" },
        { label: "No", value: "no" },
      ],
    },
  ],

  restaurant: [
    {
      questionId: "business_name",
      question: "What's your restaurant called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "restaurant_cuisine",
      question: "What type of cuisine do you serve?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "restaurant_dining_options",
      question: "What dining options do you offer?",
      type: "multi_select",
      required: false,
      order: 2,
      options: [
        { label: "Dine-in", value: "dine_in" },
        { label: "Takeout", value: "takeout" },
        { label: "Delivery", value: "delivery" },
        { label: "Catering", value: "catering" },
      ],
    },
    {
      questionId: "restaurant_reservations",
      question: "Do you take reservations?",
      type: "single_select",
      required: false,
      order: 3,
      options: [
        { label: "Yes, online", value: "yes_online" },
        { label: "Yes, phone only", value: "yes_phone" },
        { label: "Walk-in only", value: "walk_in" },
      ],
    },
    {
      questionId: "restaurant_dietary",
      question: "Any dietary options you accommodate?",
      type: "multi_select",
      required: false,
      order: 4,
      options: [
        { label: "Vegetarian", value: "vegetarian" },
        { label: "Vegan", value: "vegan" },
        { label: "Gluten-free", value: "gluten_free" },
        { label: "Halal", value: "halal" },
        { label: "Kosher", value: "kosher" },
      ],
    },
  ],

  salon_spa: [
    {
      questionId: "business_name",
      question: "What's your salon or spa called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "salon_services",
      question: "What services do you offer?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Hair styling", value: "hair" },
        { label: "Nails", value: "nails" },
        { label: "Massage", value: "massage" },
        { label: "Facials", value: "facials" },
        { label: "Waxing", value: "waxing" },
        { label: "Spa packages", value: "packages" },
      ],
    },
    {
      questionId: "salon_booking",
      question: "How do clients book?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Online booking", value: "online" },
        { label: "Phone only", value: "phone" },
        { label: "Walk-ins welcome", value: "walk_in" },
      ],
    },
  ],

  saas_product: [
    {
      questionId: "business_name",
      question: "What's your product called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "saas_product_type",
      question: "What does your software help people do?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "saas_pricing",
      question: "What's your pricing model?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Free", value: "free" },
        { label: "Freemium", value: "freemium" },
        { label: "Subscription", value: "paid" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      questionId: "saas_trial",
      question: "Do you offer a free trial?",
      type: "single_select",
      required: false,
      order: 3,
      options: [
        { label: "Yes, 7 days", value: "7_days" },
        { label: "Yes, 14 days", value: "14_days" },
        { label: "Yes, 30 days", value: "30_days" },
        { label: "No trial", value: "no" },
      ],
    },
    {
      questionId: "saas_support",
      question: "What support do you provide?",
      type: "multi_select",
      required: false,
      order: 4,
      options: [
        { label: "Self-serve documentation", value: "docs" },
        { label: "Email support", value: "email" },
        { label: "Live chat", value: "chat" },
        { label: "Dedicated account manager", value: "dedicated" },
      ],
    },
  ],

  home_services: [
    {
      questionId: "business_name",
      question: "What's your business called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "home_services_types",
      question: "What services do you provide?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "home_services_area",
      question: "What area do you serve?",
      type: "text",
      required: false,
      order: 2,
    },
    {
      questionId: "home_services_estimates",
      question: "How do you provide estimates?",
      type: "single_select",
      required: false,
      order: 3,
      options: [
        { label: "Free estimates", value: "free" },
        { label: "On-site required", value: "onsite" },
        { label: "Via photos/remote", value: "remote" },
        { label: "Flat rate pricing", value: "flat" },
      ],
    },
    {
      questionId: "home_services_emergency",
      question: "Do you offer emergency services?",
      type: "single_select",
      required: false,
      order: 4,
      options: [
        { label: "Yes, 24/7", value: "yes_24_7" },
        { label: "Yes, limited hours", value: "yes_limited" },
        { label: "No", value: "no" },
      ],
    },
  ],

  boutique_retail: [
    {
      questionId: "business_name",
      question: "What's your store called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "retail_products",
      question: "What types of products do you sell?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "retail_price_range",
      question: "How would you describe your price range?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Budget-friendly", value: "budget" },
        { label: "Mid-range", value: "mid" },
        { label: "Premium", value: "premium" },
        { label: "Luxury", value: "luxury" },
      ],
    },
    {
      questionId: "retail_returns",
      question: "What's your return policy?",
      type: "single_select",
      required: false,
      order: 3,
      options: [
        { label: "30-day returns", value: "30_day" },
        { label: "14-day returns", value: "14_day" },
        { label: "Store credit only", value: "store_credit" },
        { label: "No returns", value: "no_returns" },
      ],
    },
  ],

  gym_fitness: [
    {
      questionId: "business_name",
      question: "What's your gym or studio called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "gym_services",
      question: "What do you offer?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Gym memberships", value: "memberships" },
        { label: "Personal training", value: "personal_training" },
        { label: "Group classes", value: "classes" },
        { label: "Nutrition coaching", value: "nutrition" },
      ],
    },
  ],

  ecommerce_store: [
    {
      questionId: "business_name",
      question: "What's your store called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "ecommerce_products",
      question: "What do you sell?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "ecommerce_shipping",
      question: "Where do you ship?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Worldwide", value: "worldwide" },
        { label: "Domestic only", value: "domestic" },
        { label: "Specific regions", value: "regions" },
      ],
    },
  ],

  // Niches that previously had no questions — basic set
  therapy_practice: [
    {
      questionId: "business_name",
      question: "What's your practice called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "therapy_type",
      question: "What type of therapy do you offer?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Individual therapy", value: "individual" },
        { label: "Couples therapy", value: "couples" },
        { label: "Family therapy", value: "family" },
        { label: "Group therapy", value: "group" },
        { label: "Child/Adolescent", value: "child" },
      ],
    },
    {
      questionId: "therapy_modality",
      question: "Do you offer virtual sessions?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "In-person only", value: "in_person" },
        { label: "Virtual only", value: "virtual" },
        { label: "Both", value: "both" },
      ],
    },
  ],

  consulting_firm: [
    {
      questionId: "business_name",
      question: "What's your firm called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "consulting_focus",
      question: "What do you specialize in?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "consulting_engagement",
      question: "How do clients typically engage with you?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Hourly consulting", value: "hourly" },
        { label: "Project-based", value: "project" },
        { label: "Retainer", value: "retainer" },
        { label: "Workshops/Training", value: "workshops" },
      ],
    },
  ],

  law_office: [
    {
      questionId: "business_name",
      question: "What's your firm called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "law_practice_areas",
      question: "What areas of law do you practice?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Family law", value: "family" },
        { label: "Criminal defense", value: "criminal" },
        { label: "Personal injury", value: "personal_injury" },
        { label: "Business/Corporate", value: "corporate" },
        { label: "Real estate", value: "real_estate" },
        { label: "Immigration", value: "immigration" },
        { label: "Estate planning", value: "estate" },
      ],
    },
    {
      questionId: "law_consultation",
      question: "Do you offer free consultations?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Yes, free consultation", value: "free" },
        { label: "Paid consultation", value: "paid" },
        { label: "Depends on case", value: "depends" },
      ],
    },
  ],

  real_estate_agency: [
    {
      questionId: "business_name",
      question: "What's your agency called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "real_estate_focus",
      question: "What do you focus on?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "Residential sales", value: "residential_sales" },
        { label: "Commercial", value: "commercial" },
        { label: "Rentals", value: "rentals" },
        { label: "Property management", value: "management" },
      ],
    },
    {
      questionId: "real_estate_area",
      question: "What areas do you serve?",
      type: "text",
      required: false,
      order: 2,
    },
  ],

  hotel_hospitality: [
    {
      questionId: "business_name",
      question: "What's your property called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "hotel_type",
      question: "What type of property is it?",
      type: "single_select",
      required: false,
      order: 1,
      options: [
        { label: "Hotel", value: "hotel" },
        { label: "Boutique hotel", value: "boutique" },
        { label: "Resort", value: "resort" },
        { label: "B&B / Inn", value: "bnb" },
        { label: "Vacation rental", value: "vacation_rental" },
      ],
    },
    {
      questionId: "hotel_amenities",
      question: "What amenities do you offer?",
      type: "multi_select",
      required: false,
      order: 2,
      options: [
        { label: "Restaurant/Dining", value: "restaurant" },
        { label: "Pool", value: "pool" },
        { label: "Spa", value: "spa" },
        { label: "Gym/Fitness", value: "gym" },
        { label: "Room service", value: "room_service" },
        { label: "Conference rooms", value: "conference" },
      ],
    },
  ],

  auto_dealership: [
    {
      questionId: "business_name",
      question: "What's your dealership called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "auto_type",
      question: "What do you sell?",
      type: "multi_select",
      required: false,
      order: 1,
      options: [
        { label: "New cars", value: "new" },
        { label: "Used cars", value: "used" },
        { label: "Certified pre-owned", value: "cpo" },
        { label: "Trucks/SUVs", value: "trucks" },
        { label: "Electric vehicles", value: "ev" },
      ],
    },
    {
      questionId: "auto_services",
      question: "Do you also offer service/maintenance?",
      type: "single_select",
      required: false,
      order: 2,
      options: [
        { label: "Yes, full service center", value: "full_service" },
        { label: "Basic maintenance only", value: "basic" },
        { label: "Sales only", value: "sales_only" },
      ],
    },
  ],

  tutoring_education: [
    {
      questionId: "business_name",
      question: "What's your business called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "education_subjects",
      question: "What subjects or skills do you teach?",
      type: "text",
      required: false,
      order: 1,
    },
    {
      questionId: "education_format",
      question: "How do you deliver lessons?",
      type: "multi_select",
      required: false,
      order: 2,
      options: [
        { label: "One-on-one tutoring", value: "one_on_one" },
        { label: "Group classes", value: "group" },
        { label: "Online courses", value: "online" },
        { label: "In-person", value: "in_person" },
      ],
    },
  ],

  generic: [
    {
      questionId: "business_name",
      question: "What's your business called?",
      type: "text",
      required: false,
      order: 0,
    },
    {
      questionId: "business_description",
      question: "Describe what your business does in a few sentences.",
      type: "text",
      required: false,
      order: 1,
    },
  ],
};

// Common questions asked for every niche (appended after niche-specific)
const commonQuestions: SeedQuestion[] = [
  {
    questionId: "agent_capabilities",
    question: "What should your AI Front Desk be able to do?",
    type: "multi_select",
    required: false,
    order: 100,
    options: [
      { label: "Answer customer questions", value: "answer_questions" },
      { label: "Take bookings/appointments", value: "take_bookings" },
      { label: "Process orders", value: "process_orders" },
      { label: "Collect leads", value: "collect_leads" },
      { label: "Give recommendations", value: "give_recommendations" },
    ],
  },
  {
    questionId: "escalation_strategy",
    question: "When the AI can't help a customer, what should happen?",
    type: "single_select",
    required: false,
    order: 101,
    options: [
      { label: "Hand off to a human (Recommended)", value: "human_handoff" },
      { label: "AI handles everything", value: "full_auto" },
      { label: "Collect info and notify me later", value: "collect_and_notify" },
      { label: "Only answer known questions", value: "faq_only" },
    ],
  },
  {
    questionId: "knowledge_sources",
    question: "Where should your AI learn from?",
    type: "multi_select",
    required: false,
    order: 102,
    options: [
      { label: "Website", value: "website" },
      { label: "Documents", value: "documents" },
      { label: "FAQ", value: "faq" },
      { label: "Products catalog", value: "products" },
      { label: "Database", value: "database" },
    ],
  },
  {
    questionId: "tone_preference",
    question: "How should your AI sound?",
    type: "single_select",
    required: false,
    order: 103,
    options: [
      { label: "Friendly & Warm", value: "friendly", description: "Casual, approachable tone" },
      { label: "Professional", value: "professional", description: "Formal and polished" },
      { label: "Helpful & Eager", value: "helpful", description: "Solution-focused" },
      { label: "Concise & Direct", value: "concise", description: "Brief, to-the-point" },
    ],
  },
];

async function main() {
  console.log("Seeding question templates...");

  // Clear existing
  await prisma.questionTemplate.deleteMany();

  // Seed niche questions
  for (const [niche, questions] of Object.entries(nicheQuestions)) {
    for (const q of questions) {
      await prisma.questionTemplate.create({
        data: {
          nicheType: niche,
          questionId: q.questionId,
          question: q.question,
          type: q.type,
          options: q.options || null,
          required: q.required,
          order: q.order,
          dependsOn: q.dependsOn || null,
          category: "niche",
        },
      });
    }
    console.log(`  ✓ ${niche}: ${questions.length} questions`);
  }

  // Seed common questions
  for (const q of commonQuestions) {
    await prisma.questionTemplate.create({
      data: {
        nicheType: "common",
        questionId: q.questionId,
        question: q.question,
        type: q.type,
        options: q.options || null,
        required: q.required,
        order: q.order,
        dependsOn: q.dependsOn || null,
        category: "common",
      },
    });
  }
  console.log(`  ✓ common: ${commonQuestions.length} questions`);

  const total = await prisma.questionTemplate.count();
  console.log(`\nDone! ${total} questions seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
