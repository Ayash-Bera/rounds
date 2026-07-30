import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { importShiftsCsv, importStaffCsv } from "@/lib/import/run-import";

const MANAGER_EMAIL = "manager@clinicmail.test";
const MANAGER_PASSWORD = "rounds123!";

async function main() {
  console.log("Seeding manager account...");
  const passwordHash = await bcrypt.hash(MANAGER_PASSWORD, 10);
  const manager = await prisma.user.upsert({
    where: { email: MANAGER_EMAIL },
    update: {},
    create: {
      email: MANAGER_EMAIL,
      fullName: "Morgan Alvarez",
      role: "MANAGER",
      passwordHash,
    },
  });

  const staffCsv = readFileSync(path.join(__dirname, "seed-data/staff.csv"), "utf-8");
  const shiftsCsv = readFileSync(path.join(__dirname, "seed-data/shifts.csv"), "utf-8");

  console.log("Importing staff.csv...");
  const staffResult = await importStaffCsv(staffCsv, "SEED", "staff.csv");
  console.log(`  ${staffResult.accepted}/${staffResult.total} rows accepted or merged into an account.`);

  console.log("Importing shifts.csv...");
  const shiftsResult = await importShiftsCsv(shiftsCsv, "SEED", "shifts.csv", manager.id);
  console.log(`  ${shiftsResult.accepted}/${shiftsResult.total} rows accepted or merged into a shift.`);

  const staffSample = await prisma.user.findMany({
    where: { role: "STAFF" },
    take: 3,
    orderBy: { email: "asc" },
  });

  console.log("\nSeeded logins (see README for the full list):");
  console.log(`  manager  ${MANAGER_EMAIL} / ${MANAGER_PASSWORD}`);
  for (const s of staffSample) {
    console.log(`  staff    ${s.email} / rounds123!  (${s.profession})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
