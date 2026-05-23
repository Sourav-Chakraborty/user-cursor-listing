import "dotenv/config";
import { Worker } from "bullmq";
import connection from "../config/ioRedis";
import { prisma } from "../lib/prisma";

const worker = new Worker("mainQueue", async (job) => {
    switch (job.name) {
        case 'create_user':
            const {data} = job.data;
            const users = await prisma.user.createMany({ data });
            break;
        default:
            console.log('Unknown job')

    }
}, {
    connection
})

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.log(`Job ${job?.id} failed`);
    console.log(err);
});