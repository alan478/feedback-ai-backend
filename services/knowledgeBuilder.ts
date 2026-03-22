/**
 * Knowledge Builder - Chunks onboarding data and stores embeddings
 * Runs once after onboarding completes to build the agent's knowledge base
 */

import prisma from "./db";
import { generateEmbeddings } from "./embeddingService";
import type { OnboardingState } from "../types/onboarding";

interface KnowledgeChunkInput {
  category: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Build knowledge base from onboarding state
 * Chunks the business data by category, embeds each chunk, stores in DB
 */
export async function buildKnowledgeBase(
  agentId: string,
  state: OnboardingState
): Promise<number> {
  const chunks = chunkOnboardingData(state);

  if (chunks.length === 0) {
    throw new Error("No knowledge chunks generated from onboarding data");
  }

  // Generate embeddings for all chunks in batch
  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts);

  // Store each chunk with its embedding using raw SQL (pgvector)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const embedding = embeddings[i]!;
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" (id, "agentId", category, content, embedding, metadata, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, $5::jsonb, NOW())`,
      agentId,
      chunk.category,
      chunk.content,
      vectorStr,
      JSON.stringify(chunk.metadata || {})
    );
  }

  return chunks.length;
}

/**
 * Delete all knowledge chunks for an agent (used for re-building)
 */
export async function clearKnowledgeBase(agentId: string): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({ where: { agentId } });
}

/**
 * Descriptions for common dental services, used to generate rich per-service chunks
 */
const DENTAL_SERVICE_DESCRIPTIONS: Record<string, string> = {
  "Teeth Cleaning": "a routine preventive procedure where a dental hygienist removes plaque, tartar, and surface stains from the teeth. Regular cleanings (recommended every 6 months) help prevent cavities, gum disease, and bad breath",
  "Dental Cleaning": "a routine preventive procedure where a dental hygienist removes plaque, tartar, and surface stains from the teeth. Regular cleanings (recommended every 6 months) help prevent cavities, gum disease, and bad breath",
  "Crowns": "custom-fitted caps placed over damaged or weakened teeth to restore their shape, size, strength, and appearance. Crowns are commonly used after root canals, for cracked teeth, or to cover severely decayed teeth",
  "Crown": "a custom-fitted cap placed over a damaged or weakened tooth to restore its shape, size, strength, and appearance. Crowns are commonly used after root canals, for cracked teeth, or to cover severely decayed teeth",
  "Root Canal": "a treatment to save a badly infected or damaged tooth by removing the infected pulp tissue inside the tooth, cleaning and disinfecting the canal, then sealing it. This procedure relieves severe tooth pain and prevents the need for extraction",
  "Root Canals": "treatments to save badly infected or damaged teeth by removing the infected pulp tissue inside the tooth, cleaning and disinfecting the canal, then sealing it. This procedure relieves severe tooth pain and prevents the need for extraction",
  "Fillings": "used to repair teeth that have cavities or minor damage. The dentist removes the decayed portion of the tooth and fills the area with a durable material such as composite resin, amalgam, or porcelain to restore the tooth's function",
  "Dental Fillings": "used to repair teeth that have cavities or minor damage. The dentist removes the decayed portion of the tooth and fills the area with a durable material such as composite resin, amalgam, or porcelain to restore the tooth's function",
  "Teeth Whitening": "a cosmetic procedure that lightens the color of teeth and removes stains and discoloration. Professional whitening is performed in the office using safe, clinical-grade bleaching agents for noticeable results in a single visit",
  "Whitening": "a cosmetic procedure that lightens the color of teeth and removes stains and discoloration. Professional whitening is performed in the office using safe, clinical-grade bleaching agents for noticeable results in a single visit",
  "Veneers": "thin, custom-made shells of tooth-colored porcelain or composite bonded to the front surface of teeth to improve their appearance. Veneers are used to fix chipped, stained, misaligned, or unevenly spaced teeth",
  "Dental Veneers": "thin, custom-made shells of tooth-colored porcelain or composite bonded to the front surface of teeth to improve their appearance. Veneers are used to fix chipped, stained, misaligned, or unevenly spaced teeth",
  "Braces": "orthodontic devices used to straighten misaligned teeth and correct bite issues. Treatment typically takes 12–24 months and includes regular adjustment visits to gradually move teeth into proper alignment",
  "Orthodontics": "the specialty of correcting misaligned teeth and jaws using braces, clear aligners, or other appliances. Treatment improves both the appearance and function of the bite",
  "Invisalign": "a modern orthodontic treatment using a series of custom-made, clear, removable aligners to gradually straighten teeth without traditional metal braces. Aligners are nearly invisible and can be removed for eating and brushing",
  "Dental Implants": "permanent replacement teeth anchored into the jawbone with titanium posts. Implants look, feel, and function like natural teeth and are a long-lasting solution for missing teeth",
  "Implants": "permanent replacement teeth anchored into the jawbone with titanium posts. Implants look, feel, and function like natural teeth and are a long-lasting solution for missing teeth",
  "Extractions": "the removal of a tooth that is severely damaged, decayed, or causing crowding. The procedure is performed under local anesthesia to ensure patient comfort",
  "Tooth Extraction": "the removal of a tooth that is severely damaged, decayed, or causing crowding. The procedure is performed under local anesthesia to ensure patient comfort",
  "Wisdom Teeth Removal": "the surgical extraction of one or more wisdom teeth (third molars) that are impacted, causing pain, or at risk of infection. This is a common procedure typically performed under local anesthesia or sedation",
  "Dentures": "removable prosthetic devices designed to replace missing teeth and surrounding tissue. Available as full dentures (replacing all teeth) or partial dentures (replacing some teeth), they restore the ability to eat, speak, and smile naturally",
  "Bridges": "fixed dental prosthetics used to replace one or more missing teeth by anchoring to adjacent natural teeth or implants. Bridges restore your smile, maintain facial shape, and prevent remaining teeth from shifting",
  "Dental Bridge": "a fixed dental prosthetic used to replace one or more missing teeth by anchoring to adjacent natural teeth or implants. Bridges restore your smile, maintain facial shape, and prevent remaining teeth from shifting",
  "Gum Treatment": "treatment for gum disease (periodontal disease), which may include deep cleaning (scaling and root planing), antibiotic therapy, or surgical intervention. Gum treatment helps prevent tooth loss and maintains overall oral health",
  "Periodontics": "the specialty focused on preventing, diagnosing, and treating gum disease and other conditions affecting the tissues supporting the teeth. Treatments range from deep cleaning to surgical procedures",
  "Pediatric Dentistry": "dental care specifically tailored for infants, children, and adolescents. Services include routine exams, cleanings, fluoride treatments, sealants, and education on proper oral hygiene habits",
  "Children's Dentistry": "dental care specifically tailored for infants, children, and adolescents. Services include routine exams, cleanings, fluoride treatments, sealants, and education on proper oral hygiene habits",
  "Cosmetic Dentistry": "a range of elective procedures designed to improve the appearance of your smile, including whitening, veneers, bonding, and smile makeovers. These treatments help patients feel more confident about their teeth",
  "Dental X-Rays": "diagnostic imaging used to detect problems not visible during a regular exam, such as cavities between teeth, impacted teeth, jawbone damage, and infections. Digital X-rays use minimal radiation and provide instant results",
  "X-Rays": "diagnostic imaging used to detect problems not visible during a regular exam, such as cavities between teeth, impacted teeth, jawbone damage, and infections. Digital X-rays use minimal radiation and provide instant results",
  "Fluoride Treatment": "a preventive treatment where concentrated fluoride is applied to the teeth to strengthen enamel and help prevent cavities. It is quick, painless, and especially beneficial for children and patients at higher risk of tooth decay",
  "Sealants": "thin protective coatings applied to the chewing surfaces of back teeth (molars) to prevent cavities. Sealants are especially recommended for children and teenagers but can benefit adults as well",
  "Dental Sealants": "thin protective coatings applied to the chewing surfaces of back teeth (molars) to prevent cavities. Sealants are especially recommended for children and teenagers but can benefit adults as well",
  "Oral Surgery": "surgical procedures involving the teeth, gums, jaw, or other oral structures. This includes tooth extractions, implant placement, corrective jaw surgery, and treatment of oral pathology",
  "TMJ Treatment": "treatment for temporomandibular joint (TMJ) disorders, which cause jaw pain, clicking, difficulty chewing, and headaches. Treatment options include bite guards, physical therapy, medication, and in some cases, surgery",
  "Sedation Dentistry": "the use of medication to help patients relax during dental procedures. Options range from mild sedation (nitrous oxide/laughing gas) to moderate sedation (oral medication) to deep sedation, making dental visits comfortable for anxious patients",
  "Emergency Dental Care": "immediate treatment for urgent dental problems such as severe toothaches, knocked-out teeth, broken teeth, dental abscesses, or injuries to the mouth. Emergency care aims to relieve pain and prevent further damage",
  "Teeth Grinding Treatment": "treatment for bruxism (teeth grinding and clenching), which can cause tooth damage, jaw pain, and headaches. Common treatments include custom night guards, stress management, and bite adjustments",
  "Mouth Guards": "custom-fitted protective devices worn over the teeth to prevent damage from sports injuries or nighttime teeth grinding (bruxism). Custom mouth guards offer superior fit and protection compared to over-the-counter options",
  "Dental Bonding": "a cosmetic procedure where tooth-colored composite resin is applied and sculpted onto a tooth to repair chips, cracks, gaps, or discoloration. Bonding is a quick, affordable alternative to veneers",
  "Crowns & Bridges": "dental restorations that repair and replace damaged or missing teeth. Crowns are custom-fitted caps placed over weakened teeth to restore shape and strength, while bridges are fixed prosthetics that replace one or more missing teeth by anchoring to adjacent teeth. Together, they restore function, appearance, and bite alignment",
  "Orthodontics/Braces": "treatments to straighten misaligned teeth and correct bite issues. Options include traditional metal braces, ceramic braces, and clear aligners like Invisalign. Treatment typically takes 12–24 months with regular adjustment visits to gradually move teeth into proper alignment",
};

/**
 * Format a time string like "09:00" to "9:00 AM"
 */
function formatTime(time: string): string {
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr!, 10);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Parse operating hours string into a human-readable description.
 * Handles formats like "Monday: 09:00-17:00, Tuesday: 09:00-17:00" or
 * "Monday-Friday: 9am-5pm" etc.
 */
function parseHoursToNaturalLanguage(biz: string, hoursStr: string): string {
  // Try to parse structured day-by-day hours: "Monday: 09:00-17:00, Tuesday: ..."
  const dayPattern = /(\w+):\s*([\d:]+)\s*-\s*([\d:]+)/g;
  const matches = [...hoursStr.matchAll(dayPattern)];

  if (matches.length > 0) {
    // Group consecutive days with the same hours
    const schedule: { day: string; open: string; close: string }[] = [];
    for (const m of matches) {
      schedule.push({ day: m[1]!, open: m[2]!, close: m[3]! });
    }

    // Find unique time ranges and which days they apply to
    const timeGroups = new Map<string, string[]>();
    for (const s of schedule) {
      const key = `${s.open}-${s.close}`;
      if (!timeGroups.has(key)) timeGroups.set(key, []);
      timeGroups.get(key)!.push(s.day);
    }

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const scheduledDays = new Set(schedule.map((s) => s.day));
    const closedDays = allDays.filter((d) => !scheduledDays.has(d));

    const parts: string[] = [];
    for (const [timeRange, days] of timeGroups) {
      const [open, close] = timeRange.split("-");
      const openFormatted = formatTime(open!);
      const closeFormatted = formatTime(close!);
      if (days.length >= 5 && days.every((d, i) => d === allDays[i])) {
        parts.push(`Monday through Friday from ${openFormatted} to ${closeFormatted}`);
      } else if (days.length === 1) {
        parts.push(`${days[0]} from ${openFormatted} to ${closeFormatted}`);
      } else {
        parts.push(`${days.slice(0, -1).join(", ")} and ${days[days.length - 1]} from ${openFormatted} to ${closeFormatted}`);
      }
    }

    let result = `${biz} is open ${parts.join(", and ")}.`;
    if (closedDays.length > 0) {
      if (closedDays.length === 2 && closedDays.includes("Saturday") && closedDays.includes("Sunday")) {
        result += ` The office is closed on weekends.`;
      } else {
        result += ` The office is closed on ${closedDays.join(" and ")}.`;
      }
    }
    result += ` Patients can schedule appointments during these hours by calling the office.`;
    return result;
  }

  // Fallback: use the raw string with context
  return `${biz} operating hours are: ${hoursStr}. Patients can schedule appointments during these hours by calling the office.`;
}

/**
 * Niche-friendly label for the business type
 */
function nicheLabel(niche?: string): string {
  const labels: Record<string, string> = {
    dental_clinic: "dental clinic",
    medical_practice: "medical practice",
    therapy_practice: "therapy practice",
    salon_spa: "salon and spa",
    gym_fitness: "gym and fitness center",
    restaurant: "restaurant",
    consulting_firm: "consulting firm",
    law_office: "law office",
    real_estate_agency: "real estate agency",
    hotel_hospitality: "hotel",
    auto_dealership: "auto dealership",
    home_services: "home services provider",
    tutoring_education: "tutoring and education center",
  };
  return labels[niche || ""] || niche?.replace(/_/g, " ") || "business";
}

/**
 * Chunk onboarding data into rich, descriptive, natural-language pieces.
 * Each chunk reads like a knowledgeable receptionist describing the business.
 */
function chunkOnboardingData(state: OnboardingState): KnowledgeChunkInput[] {
  const chunks: KnowledgeChunkInput[] = [];
  const biz = state.businessName || "the business";
  const niche = nicheLabel(state.niche);
  const isDental = state.niche === "dental_clinic";

  // ── Welcome / Greeting ──
  chunks.push({
    category: "welcome",
    content: `Welcome to ${biz}! We are a ${niche}${state.businessDescription ? `. ${state.businessDescription}` : ""}. Our friendly team is here to help you. Whether you're a new or returning ${isDental ? "patient" : "customer"}, we're happy to assist you with any questions, appointment scheduling, or information about our services.`,
    metadata: { niche: state.niche },
  });

  // ── General business identity ──
  if (state.businessDescription) {
    chunks.push({
      category: "general",
      content: `${biz} is a ${niche}. ${state.businessDescription}${state.targetCustomers ? ` We primarily serve ${state.targetCustomers}.` : ""}`,
      metadata: { niche: state.niche, industry: state.industry },
    });
  }

  // ── Niche-specific chunks (structured dental path) ──
  if (isDental && state.nicheData?.dental) {
    const dental = state.nicheData.dental;

    // Per-service chunks with detailed descriptions
    if (dental.services?.length) {
      // Overview chunk listing all services
      chunks.push({
        category: "services",
        content: `${biz} offers a comprehensive range of dental services including: ${dental.services.join(", ")}. Our dental team is experienced in both preventive and restorative dentistry. Patients can inquire about any of these services or schedule an appointment by contacting our office.`,
        metadata: { services: dental.services },
      });

      // Individual service chunks with rich descriptions
      for (const service of dental.services) {
        const description = DENTAL_SERVICE_DESCRIPTIONS[service];
        if (description) {
          chunks.push({
            category: "services",
            content: `${biz} offers ${service}. ${service} is ${description}. To learn more about this service or to schedule an appointment, please contact our office.`,
            metadata: { service },
          });
        } else {
          chunks.push({
            category: "services",
            content: `${biz} offers ${service} as part of our dental services. Patients interested in ${service} can contact our office to learn more about what the procedure involves, expected duration, and to schedule an appointment.`,
            metadata: { service },
          });
        }
      }
    }

    // Insurance — rich chunk
    chunks.push({
      category: "insurance",
      content: dental.acceptsInsurance
        ? `${biz} accepts dental insurance. We work with a variety of insurance providers to help patients maximize their benefits. Patients should bring their insurance card and a valid photo ID to their appointment. Our front desk team can verify insurance eligibility and help explain coverage details, including co-pays and deductibles. If you are unsure whether your plan is accepted, please call our office and we will be happy to check for you.`
        : `${biz} does not currently accept dental insurance. Payment is expected at the time of service. We accept cash, credit cards, and debit cards. For patients who need financial assistance, we may offer payment plans or financing options — please ask our front desk team for details.`,
      metadata: { acceptsInsurance: dental.acceptsInsurance },
    });

    // Emergency — rich chunk
    chunks.push({
      category: "emergency",
      content: dental.emergencyHours
        ? `${biz} provides emergency dental care during business hours. If you are experiencing a dental emergency such as severe tooth pain, a knocked-out tooth, a broken or cracked tooth, a dental abscess, uncontrolled bleeding, or trauma to the mouth, please call our office immediately. We prioritize emergency cases and will do our best to see you as soon as possible, often on the same day. For after-hours emergencies, please call our office number for instructions on our emergency answering service.`
        : `${biz} does not offer after-hours emergency dental care. If you experience a dental emergency during business hours, please call our office and we will try to accommodate you. For emergencies outside our business hours, please visit the nearest hospital emergency room or call 911. Common dental emergencies include severe toothache, knocked-out teeth, broken teeth, and uncontrolled oral bleeding.`,
      metadata: { emergencyHours: dental.emergencyHours },
    });

    // Booking lead time — rich chunk
    if (dental.bookingLeadTime) {
      chunks.push({
        category: "booking",
        content: `Appointments at ${biz} should ideally be booked at least ${dental.bookingLeadTime} in advance to ensure availability. However, we understand that scheduling needs can change, so we encourage patients to call even for shorter-notice appointments — we will do our best to accommodate you. New patients are welcome and can schedule their first visit by calling our office. Please arrive 10–15 minutes early for your first appointment to complete any necessary paperwork.`,
        metadata: { bookingLeadTime: dental.bookingLeadTime },
      });
    }
  }

  // ── Flat nicheData from message-based onboarding (chat-based flow) ──
  if (state.nicheData) {
    for (const [key, value] of Object.entries(state.nicheData)) {
      // Skip internal tracking
      if (key === "answeredQuestions" || key === "answeredQuestionIds") continue;
      // Skip structured dental data (handled above)
      if (key === "dental" && typeof value === "object") continue;

      const strValue = String(value);

      if (key === "dental_services") {
        // Parse comma-separated services
        const services = strValue.split(/,\s*/);

        // Overview chunk
        chunks.push({
          category: "services",
          content: `${biz} offers a comprehensive range of dental services including: ${services.join(", ")}. Our dental team is experienced in both preventive and restorative dentistry. Patients can inquire about any of these services or schedule an appointment by contacting our office.`,
          metadata: { questionId: key, services },
        });

        // Individual service chunks
        for (const service of services) {
          const trimmed = service.trim();
          if (!trimmed) continue;
          const description = DENTAL_SERVICE_DESCRIPTIONS[trimmed];
          if (description) {
            chunks.push({
              category: "services",
              content: `${biz} offers ${trimmed}. ${trimmed} is ${description}. To learn more about this service or to schedule an appointment, please contact our office.`,
              metadata: { questionId: key, service: trimmed },
            });
          } else {
            chunks.push({
              category: "services",
              content: `${biz} offers ${trimmed} as part of our dental services. Patients interested in ${trimmed} can contact our office to learn more about what the procedure involves, expected duration, and to schedule an appointment.`,
              metadata: { questionId: key, service: trimmed },
            });
          }
        }
      } else if (key === "dental_insurance") {
        const accepts = strValue.toLowerCase().includes("yes") || strValue.toLowerCase() === "true";
        chunks.push({
          category: "insurance",
          content: accepts
            ? `${biz} accepts dental insurance. We work with a variety of insurance providers to help patients maximize their benefits. Patients should bring their insurance card and a valid photo ID to their appointment. Our front desk team can verify insurance eligibility and help explain coverage details. If you are unsure whether your plan is accepted, please call our office.`
            : `${biz} does not currently accept dental insurance. Payment is expected at the time of service. We accept cash, credit cards, and debit cards.`,
          metadata: { questionId: key, acceptsInsurance: accepts },
        });
      } else if (key === "dental_insurance_providers") {
        chunks.push({
          category: "insurance",
          content: `${biz} accepts the following dental insurance providers: ${strValue}. If your insurance provider is not listed, please call our office to check — we may still be able to work with your plan. Patients should bring their insurance card to every visit. Our front desk team is happy to help verify your coverage and explain any out-of-pocket costs.`,
          metadata: { questionId: key, providers: strValue },
        });
      } else if (key === "dental_emergency") {
        const hasEmergency = strValue.toLowerCase().includes("yes");
        const is24_7 = strValue.toLowerCase().includes("24") || strValue.toLowerCase().includes("always");
        const businessHoursOnly = strValue.toLowerCase().includes("business");
        chunks.push({
          category: "emergency",
          content: hasEmergency
            ? is24_7
              ? `${biz} provides 24/7 emergency dental care. If you are experiencing a dental emergency such as severe tooth pain, a knocked-out tooth, a broken or cracked tooth, a dental abscess, or trauma to the mouth, you can reach us at any time. Call our office number and follow the prompts for emergency care. Our on-call dentist will assess your situation and provide guidance or schedule an immediate visit.`
              : `${biz} provides emergency dental care${businessHoursOnly ? " during regular business hours" : ""}. If you are experiencing a dental emergency such as severe tooth pain, a knocked-out tooth, a broken or cracked tooth, a dental abscess, uncontrolled bleeding, or trauma to the mouth, please call our office immediately. We prioritize emergency cases and will do our best to see you as soon as possible, often on the same day.`
            : `${biz} does not currently offer emergency dental services. For dental emergencies, we recommend visiting the nearest hospital emergency room or calling 911. Common dental emergencies include severe toothache, knocked-out teeth, broken teeth, and uncontrolled oral bleeding. You may also call our office during business hours for guidance.`,
          metadata: { questionId: key, emergencyAvailable: hasEmergency },
        });
      } else if (key === "dental_clinic_hours") {
        chunks.push({
          category: "hours",
          content: parseHoursToNaturalLanguage(biz, strValue),
          metadata: { questionId: key, rawHours: strValue },
        });
      } else if (key === "dental_booking") {
        chunks.push({
          category: "booking",
          content: `Appointments at ${biz} should ideally be booked at least ${strValue} in advance to ensure availability. However, we encourage patients to call even for shorter-notice requests — we will do our best to accommodate you. New patients are welcome and can schedule their first visit by calling our office. Please arrive 10–15 minutes early for your first appointment to complete any necessary paperwork.`,
          metadata: { questionId: key },
        });
      } else {
        // Generic fallback for unknown keys — still make it conversational
        const label = key.replace(/_/g, " ");
        chunks.push({
          category: label,
          content: `Regarding ${label} at ${biz}: ${strValue}. For more details, please don't hesitate to contact our office directly.`,
          metadata: { questionId: key },
        });
      }
    }
  }

  // ── Primary services (generic, works for any niche) ──
  if (state.primaryServices?.length) {
    chunks.push({
      category: "services",
      content: `${biz} provides the following services: ${state.primaryServices.join(", ")}. Our team is experienced and dedicated to delivering high-quality service. Please contact us to learn more about any of these offerings or to schedule an appointment.`,
      metadata: { services: state.primaryServices },
    });

    // Generate individual service chunks with descriptions (dental)
    if (isDental) {
      for (const service of state.primaryServices) {
        const description = DENTAL_SERVICE_DESCRIPTIONS[service];
        if (description) {
          chunks.push({
            category: "services",
            content: `${biz} offers ${service}. ${service} is ${description}. To learn more about this service or to schedule an appointment, please contact our office.`,
            metadata: { service },
          });
        } else {
          chunks.push({
            category: "services",
            content: `${biz} offers ${service} as part of our dental services. Patients interested in ${service} can contact our office to learn more about what the procedure involves, expected duration, and to schedule an appointment.`,
            metadata: { service },
          });
        }
      }
    }
  }

  // ── Agent capabilities ──
  if (state.agentCapabilities?.length) {
    const capabilityDescriptions: Record<string, string> = {
      answer_questions: "answer questions about the business, services, hours, and policies",
      take_bookings: "help schedule appointments and bookings",
      process_orders: "process orders",
      provide_quotes: "provide price quotes and estimates",
      collect_leads: "collect contact information for follow-up",
      give_recommendations: "give personalized recommendations based on your needs",
      handle_complaints: "handle complaints and feedback professionally",
      check_availability: "check appointment availability and scheduling options",
      track_orders: "help track orders and delivery status",
    };

    const capabilities = state.agentCapabilities
      .map((c) => capabilityDescriptions[c] || c)
      .join("; ");

    const escalationText =
      state.escalationStrategy === "human_handoff"
        ? "transfer you to a human team member who can help further"
        : state.escalationStrategy === "collect_and_notify"
        ? "collect your contact information and have a team member follow up with you personally"
        : "do its best to help or suggest contacting the office directly";

    chunks.push({
      category: "capabilities",
      content: `The virtual assistant for ${biz} is here to help you with the following: ${capabilities}. If your request falls outside these areas, the assistant will ${escalationText}. You can ask anything and the assistant will guide you to the right answer or the right person.`,
      metadata: {
        capabilities: state.agentCapabilities,
        escalation: state.escalationStrategy,
      },
    });
  }

  // ── Escalation details ──
  if (state.escalationStrategy && state.escalationStrategy !== "full_auto") {
    chunks.push({
      category: "escalation",
      content: `If the virtual assistant at ${biz} is unable to fully answer your question or handle your request, here is what happens: ${
        state.escalationStrategy === "human_handoff"
          ? "Your conversation will be transferred to a human team member who can provide personalized assistance. A staff member will join the conversation to help you directly."
          : state.escalationStrategy === "collect_and_notify"
          ? "The assistant will collect your name, phone number or email, and a brief description of what you need. A team member from our office will then follow up with you as soon as possible, usually within one business day."
          : state.escalationStrategy === "faq_only"
          ? "The assistant is designed to answer frequently asked questions only. For anything beyond those topics, we recommend contacting the office directly by phone or email for personalized assistance."
          : "The assistant will attempt to handle your request automatically."
      }${state.handoffContact ? ` You can also reach us directly at: ${state.handoffContact}.` : ""}`,
      metadata: { strategy: state.escalationStrategy },
    });
  }

  // ── Contact / Website ──
  if (state.websiteUrl) {
    chunks.push({
      category: "contact",
      content: `You can learn more about ${biz} by visiting our website at ${state.websiteUrl}. Our website has additional information about our services, team, location, and more. You can also contact us through the website if you prefer.`,
      metadata: { url: state.websiteUrl },
    });
  }

  // ── Cancellation policy (reasonable default) ──
  chunks.push({
    category: "cancellation",
    content: `${biz} asks that patients provide at least 24 hours' notice if they need to cancel or reschedule an appointment. This allows us to offer the time slot to other ${isDental ? "patients" : "customers"} who may be waiting. Late cancellations or missed appointments (no-shows) may be subject to a cancellation fee. If you need to cancel or reschedule, please call our office as soon as possible.`,
    metadata: { policy: "default_cancellation" },
  });

  // ── Payment information (reasonable default) ──
  chunks.push({
    category: "payment",
    content: `${biz} accepts multiple forms of payment for your convenience. We typically accept cash, all major credit cards (Visa, Mastercard, American Express, Discover), and debit cards. Payment is generally expected at the time of service.${isDental ? " For patients with dental insurance, we will process your insurance claim and you will be responsible for any co-pays or remaining balance. We may also offer payment plans or financing for larger treatments — please ask our front desk team about available options." : " For questions about payment options or financing, please contact our office."}`,
    metadata: { policy: "default_payment" },
  });

  return chunks;
}

export { chunkOnboardingData };
