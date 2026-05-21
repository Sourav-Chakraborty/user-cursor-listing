import { Queue } from 'bullmq'
import connection from '../config/ioRedis'

const mainQueue = new Queue("mainQueue", {
    connection
})

export default mainQueue