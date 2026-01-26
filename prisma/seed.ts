import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a default organization for development
  const org = await prisma.organization.upsert({
    where: { slug: "default-org" },
    update: {},
    create: {
      id: "default-org",
      name: "Development Org",
      slug: "default-org",
      plan: "pro",
    },
  });

  console.log("Seeded organization:", org);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
