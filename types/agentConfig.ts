import type {
  AgentCapability,
  EscalationStrategy,
  TonePreset,
  KnowledgeSource,
  NicheSpecificData,
} from "./onboarding";

/**
 * Typed structure for Agent.config JSON column.
 * Stored as JSON in Postgres, typed in application code.
 */
export interface AgentConfig {
  capabilities: AgentCapability[];
  escalationStrategy: EscalationStrategy;
  handoffContact?: string;
  tone: TonePreset;
  language: string;
  responseStyle: "concise" | "detailed";
  knowledgeSources: KnowledgeSource[];
  websiteUrl?: string;
  nicheData?: NicheSpecificData;
}
