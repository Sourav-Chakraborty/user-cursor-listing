import ioRedis from 'ioredis'

const connection = new ioRedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
})

export default connection

