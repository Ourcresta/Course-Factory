import { seedEnterpriseData } from "./enterprise-seed";

async function main() {
  try {
    await seedEnterpriseData();
    console.log("\nSeed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();
