import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Prisma, User } from "./generated/prisma/client";
import parseCSV from "./lib/csvParser";
import upload from "./lib/multer";
import mainQueue from "./lib/mainQueue";
import { prisma } from "./lib/prisma";
import { connectRedis, redisClient } from "./lib/redisServer";

const app = express();
const port = process.env.PORT || 3000;

app.post("/user", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const data = (await parseCSV(req.file.buffer)) as User[];
  // const users = await prisma.user.createMany({ data });
  const job = await mainQueue.add("create_user", { data });
  await redisClient.del("user:*");

  return res.json({ message: "Successfullly parsed", data: job.id });
});

app.get("/user", async (req, res) => {
  const { limit, offset = 1, searchText } = req.query;

  const redisKey = `user:${offset}-${limit}-${searchText}`;

  const cachedData = await redisClient.get(redisKey);
  if (cachedData) {
    return res.json({ message: "User fetched", data: JSON.parse(cachedData) });
  }

  const where: Prisma.UserWhereInput = {};
  if (searchText) {
    where.OR = [
      { name: { contains: String(searchText) } },
      { email: { contains: String(searchText) } },
    ];
  }

  // Cursor based pagination
  const allUsers = await prisma.user.findMany({
    where,
    cursor: {
      id: Number(offset),
    },
    include: {
      posts: true,
    },
    take: Number(limit),
    skip: Number(offset) > 1 ? 1 : 0,
    orderBy: {
      id: "asc",
    },
  });

  await redisClient.set(redisKey, JSON.stringify(allUsers), { EX: 60 });
  return res.json({ message: "User fetched again", data: allUsers });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectRedis();
});
