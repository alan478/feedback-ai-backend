import prisma from "./db";

/**
 * Create a new onboarding session
 */
export async function createSession(nicheType: string, businessName?: string, businessDescription?: string) {
  const session = await prisma.onboardingSession.create({
    data: {
      nicheType,
      businessName: businessName || null,
      businessDescription: businessDescription || null,
    },
  });
  return session;
}

/**
 * Get session with all answers
 */
export async function getSession(sessionId: string) {
  return prisma.onboardingSession.findUnique({
    where: { id: sessionId },
    include: { answers: { orderBy: { answeredAt: "asc" } } },
  });
}

/**
 * Save or update an answer for a question
 */
export async function saveAnswer(sessionId: string, questionId: string, answer: any, skipped = false) {
  return prisma.onboardingAnswer.upsert({
    where: {
      sessionId_questionId: { sessionId, questionId },
    },
    create: {
      sessionId,
      questionId,
      answer,
      skipped,
    },
    update: {
      answer,
      skipped,
      answeredAt: new Date(),
    },
  });
}

/**
 * Update session metadata (business name, description, current index)
 */
export async function updateSession(
  sessionId: string,
  data: {
    businessName?: string;
    businessDescription?: string;
    currentQuestionIndex?: number;
    metadata?: any;
  }
) {
  return prisma.onboardingSession.update({
    where: { id: sessionId },
    data,
  });
}

/**
 * Complete session and generate agent ID
 */
export async function completeSession(sessionId: string) {
  const agentId = crypto.randomUUID();
  const session = await prisma.onboardingSession.update({
    where: { id: sessionId },
    data: {
      completed: true,
      agentId,
    },
    include: { answers: true },
  });
  return session;
}
