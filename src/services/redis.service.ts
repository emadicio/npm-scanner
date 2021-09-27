import { createClient, RedisClient } from 'redis';

class RedisService {
  private static client: RedisClient;

  public static async init(): Promise<void> {
    RedisService.client = createClient({ url: process.env.REDIS_URL });
    RedisService.client.on('error', (err) => {
      console.error('❌ Redis client error', err);
      process.exit(1);
    });
    await new Promise<void>((resolve) => {
      RedisService.client.on('connect', () => {
        console.info('🔌 Redis client connected');
        resolve();
      });
    });
  }

  public static async get(key: string): Promise<string | undefined> {
    let value = null;
    await new Promise<void>((resolve) => {
      RedisService.client.get(key, (error, data) => {
        if (!error) value = data;
        else console.error(error);
        resolve();
      });
    });
    return value;
  }

  public static async set(key: string, value: string): Promise<void> {
    const expirationTime = parseInt(process.env.REDIS_EXP_TIME) || 60 * 60 * 24;
    await new Promise<void>((resolve) => {
      RedisService.client.set(key, value, 'EX', expirationTime, (error) => {
        if (error) console.error(error);
        resolve();
      });
    });
  }
}

export default RedisService;
