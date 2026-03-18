/*
  Warnings:

  - You are about to drop the `agents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledge_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_select', 'multi_select', 'text', 'schedule');

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_org_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_org_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "knowledge_sources" DROP CONSTRAINT "knowledge_sources_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_org_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_sessions" DROP CONSTRAINT "onboarding_sessions_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_sessions" DROP CONSTRAINT "onboarding_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_org_id_fkey";

-- DropTable
DROP TABLE "agents";

-- DropTable
DROP TABLE "appointments";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "knowledge_sources";

-- DropTable
DROP TABLE "leads";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "onboarding_sessions";

-- DropTable
DROP TABLE "organizations";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "AgentStatus";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "ConversationChannel";

-- DropEnum
DROP TYPE "ConversationStatus";

-- DropEnum
DROP TYPE "KnowledgeSourceStatus";

-- DropEnum
DROP TYPE "KnowledgeSourceType";

-- DropEnum
DROP TYPE "LeadSource";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "MessageRole";

-- DropEnum
DROP TYPE "OrgPlan";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "QuestionTemplate" (
    "id" TEXT NOT NULL,
    "nicheType" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "dependsOn" JSONB,
    "category" TEXT NOT NULL DEFAULT 'niche',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "nicheType" TEXT NOT NULL,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT,
    "niche" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "systemPrompt" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "escalationStrategy" TEXT NOT NULL DEFAULT 'collect_and_notify',
    "handoffContact" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(3072) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "action" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionTemplate_nicheType_idx" ON "QuestionTemplate"("nicheType");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTemplate_nicheType_questionId_key" ON "QuestionTemplate"("nicheType", "questionId");

-- CreateIndex
CREATE INDEX "OnboardingAnswer_sessionId_idx" ON "OnboardingAnswer"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingAnswer_sessionId_questionId_key" ON "OnboardingAnswer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_agentId_idx" ON "KnowledgeChunk"("agentId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_agentId_category_idx" ON "KnowledgeChunk"("agentId", "category");

-- CreateIndex
CREATE INDEX "Conversation_agentId_idx" ON "Conversation"("agentId");

-- CreateIndex
CREATE INDEX "Conversation_agentId_status_idx" ON "Conversation"("agentId", "status");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingAnswer" ADD CONSTRAINT "OnboardingAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
