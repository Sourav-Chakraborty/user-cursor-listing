import ioRedis from 'ioredis'

const connection = process.env.REDIS_URL && process.env.NODE_ENV === "production"
    ? new ioRedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new ioRedis({
        host: "127.0.0.1",
        port: 6379,
        maxRetriesPerRequest: null,
    });

export default connection

