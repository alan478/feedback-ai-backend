/**
 * Action Queue Service - Async processing of actions to prevent race conditions
 * Handles booking, escalation, and lead capture actions via a priority queue
 */

import prisma from "./db";

// In-memory locks to prevent concurrent processing of same agent+actionType
const processingLocks = new Set<string>();

const PRIORITY_MAP: Record<string, number> = {
  escalate: 10,
  booking: 5,
  lead: 1,
};

/**
 * Enqueue an action for async processing
 */
export async function enqueueAction(params: {
  agentId: string;
  conversationId: string;
  messageId: string;
  actionType: string;
  payload: Record<string, any>;
}) {
  const priority = PRIORITY_MAP[params.actionType] ?? 0;

  const entry = await prisma.actionQueue.create({
    data: {
      agentId: params.agentId,
      conversationId: params.conversationId,
      messageId: params.messageId,
      actionType: params.actionType,
      payload: params.payload,
      status: "pending",
      priority,
    },
  });

  console.log(`[ActionQueue] Enqueued ${params.actionType} action (id: ${entry.id}, priority: ${priority})`);
  return entry;
}

/**
 * Process pending items from the queue
 */
async function processQueue(): Promise<void> {
  const pendingItems = await prisma.actionQueue.findMany({
    where: { status: "pending" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 10,
  });

  if (pendingItems.length === 0) return;

  console.log(`[ActionQueue] Processing ${pendingItems.length} pending actions`);

  for (const item of pendingItems) {
    const lockKey = `${item.agentId}:${item.actionType}`;

    // Skip if another item for same agent+actionType is being processed
    if (processingLocks.has(lockKey)) {
      continue;
    }

    processingLocks.add(lockKey);

    try {
      // Mark as processing and increment attempts
      await prisma.actionQueue.update({
        where: { id: item.id },
        data: {
          status: "processing",
          attempts: item.attempts + 1,
        },
      });

      // Route to appropriate handler
      switch (item.actionType) {
        case "booking":
          await handleBookingAction(item);
          break;
        case "escalate":
          await handleEscalationAction(item);
          break;
        case "lead":
          await handleLeadAction(item);
          break;
        default:
          console.warn(`[ActionQueue] Unknown action type: ${item.actionType}`);
      }

      // Mark as completed
      await prisma.actionQueue.update({
        where: { id: item.id },
        data: {
          status: "completed",
          processedAt: new Date(),
        },
      });

      console.log(`[ActionQueue] Completed ${item.actionType} action (id: ${item.id})`);
    } catch (error: any) {
      console.error(`[ActionQueue] Failed ${item.actionType} action (id: ${item.id}):`, error.message);

      const newAttempts = item.attempts + 1;
      await prisma.actionQueue.update({
        where: { id: item.id },
        data: {
          status: newAttempts < item.maxAttempts ? "pending" : "failed",
          error: error.message,
        },
      });
    } finally {
      processingLocks.delete(lockKey);
    }
  }
}

/**
 * Handle booking action: create Booking record with conflict detection
 */
async function handleBookingAction(queueItem: any): Promise<void> {
  const payload = queueItem.payload as Record<string, any>;

  let requestedDate: Date | null = null;
  if (payload.date) {
    const parsed = new Date(payload.date);
    if (!isNaN(parsed.getTime())) {
      requestedDate = parsed;
    }
  }

  // Check for conflicts: same agent, overlapping time window (30 min), not cancelled
  let notes: string | null = null;
  if (requestedDate) {
    const windowStart = new Date(requestedDate.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(requestedDate.getTime() + 30 * 60 * 1000);

    const conflicts = await prisma.booking.findMany({
      where: {
        agentId: queueItem.agentId,
        status: { not: "cancelled" },
        requestedDate: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });

    if (conflicts.length > 0) {
      notes = `Potential scheduling conflict with ${conflicts.length} existing booking(s) in the same time window`;
    }
  }

  await prisma.booking.create({
    data: {
      agentId: queueItem.agentId,
      conversationId: queueItem.conversationId,
      actionQueueId: queueItem.id,
      customerName: payload.customerName || payload.name || null,
      customerEmail: payload.customerEmail || payload.email || null,
      customerPhone: payload.customerPhone || payload.phone || null,
      service: payload.service || "General",
      requestedDate,
      requestedDateRaw: payload.date || payload.requestedDate || null,
      status: "requested",
      notes,
    },
  });
}

/**
 * Handle escalation action: create Escalation record and update conversation
 */
async function handleEscalationAction(queueItem: any): Promise<void> {
  const payload = queueItem.payload as Record<string, any>;

  await prisma.escalation.create({
    data: {
      agentId: queueItem.agentId,
      conversationId: queueItem.conversationId,
      actionQueueId: queueItem.id,
      reason: payload.reason || "Customer requested human assistance",
      customerInfo: payload.customerInfo || null,
      status: "pending",
    },
  });

  await prisma.conversation.update({
    where: { id: queueItem.conversationId },
    data: { status: "escalated" },
  });
}

/**
 * Handle lead action: create Lead record from captured info
 */
async function handleLeadAction(queueItem: any): Promise<void> {
  const payload = queueItem.payload as Record<string, any>;

  await prisma.lead.create({
    data: {
      agentId: queueItem.agentId,
      conversationId: queueItem.conversationId,
      actionQueueId: queueItem.id,
      name: payload.name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      source: "chat",
      interest: payload.interest || payload.service || null,
      status: "new",
      metadata: payload.metadata || null,
    },
  });
}

/**
 * Start the queue processor on an interval
 * Returns a cleanup function to stop processing
 */
export function startQueueProcessor(intervalMs: number = 2000): () => void {
  console.log("[ActionQueue] Queue processor started");

  const timer = setInterval(async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error("[ActionQueue] Queue processor error:", error);
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
    console.log("[ActionQueue] Queue processor stopped");
  };
}
