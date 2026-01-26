import prisma from "../lib/db";
import type { OnboardingState } from "../types/onboarding";

/**
 * Database-backed onboarding session storage.
 * Replaces the in-memory Map<string, OnboardingState>.
 */

export async function createSession(): Promise<{
  id: string;
  state: OnboardingState;
}> {
  const initialState: OnboardingState = {
    businessDescription: "",
    currentStage: 0,
    rawInputs: [],
    language: "en",
    responseStyle: "concise",
    onboardingCompleted: false,
    fieldsSkippedByUser: [],
  };

  const session = await prisma.onboardingSession.create({
    data: {
      state: initialState as any,
      currentStage: 0,
      completed: false,
    },
  });

  return { id: session.id, state: initialState };
}

export async function getSession(
  sessionId: string
): Promise<OnboardingState | null> {
  const session = await prisma.onboardingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;
  return session.state as unknown as OnboardingState;
}

export async function updateSession(
  sessionId: string,
  state: OnboardingState
): Promise<void> {
  await prisma.onboardingSession.update({
    where: { id: sessionId },
    data: {
      state: state as any,
      currentStage: state.currentStage ?? 0,
      completed: state.onboardingCompleted ?? false,
    },
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.onboardingSession.delete({
    where: { id: sessionId },
  });
}

export async function getSessionRecord(sessionId: string) {
  return prisma.onboardingSession.findUnique({
    where: { id: sessionId },
  });
}

export async function completeSession(
  sessionId: string,
  agentId: string
): Promise<void> {
  await prisma.onboardingSession.update({
    where: { id: sessionId },
    data: {
      completed: true,
      agentId,
    },
  });
}
