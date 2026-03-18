import prisma from "./db";

export interface ApiQuestion {
  id: string;
  question: string;
  type: "single-select" | "multi-select" | "text" | "schedule";
  required: boolean;
  order: number;
  options: { label: string; value: string; description?: string }[] | null;
  dependsOn: { questionId: string; values: string[] } | null;
  category: string;
}

const TYPE_MAP: Record<string, ApiQuestion["type"]> = {
  single_select: "single-select",
  multi_select: "multi-select",
  text: "text",
  schedule: "schedule",
};

/**
 * Get all questions for a niche (niche-specific + common), ordered
 */
export async function getQuestionsByNiche(nicheType: string): Promise<ApiQuestion[]> {
  const rows = await prisma.questionTemplate.findMany({
    where: {
      OR: [{ nicheType }, { nicheType: "common" }],
    },
    orderBy: { order: "asc" },
  });

  return rows.map((row) => ({
    id: row.questionId,
    question: row.question,
    type: TYPE_MAP[row.type] || "text",
    required: row.required,
    order: row.order,
    options: (row.options as ApiQuestion["options"]) || null,
    dependsOn: (row.dependsOn as ApiQuestion["dependsOn"]) || null,
    category: row.category,
  }));
}
