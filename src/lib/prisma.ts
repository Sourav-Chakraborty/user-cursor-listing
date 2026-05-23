import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  ssl: process.env.NODE_ENV === "production" ? {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  } : undefined,
});
const prisma = new PrismaClient({ adapter });
export { prisma };