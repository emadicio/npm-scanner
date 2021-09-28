import { createClient, RedisClient } from 'redis';

class RedisService {
  private static client: RedisClient;

  public static async init(): Promise<void> {
    RedisService.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379/',
    });
    RedisService.client.on('error', (err) => {
      console.error('❌ Redis client error', err);
      process.exit(1);
    });
    await new Promise<void>((resolve) => {
      this.client.on('connect', () => {
        console.info('🔌 Redis client connected');
        resolve();
      });
    });
  }

  public static async get(key: string): Promise<string | undefined> {
    let value;
    await new Promise<void>((resolve) => {
      this.client.get(key, (error, data) => {
        if (error) console.error(error);
        if (data) value = data;
        resolve();
      });
    });
    return value as string;
  }

  public static async set(key: string, value: string): Promise<void> {
    const expirationTime = parseInt(process.env.REDIS_EXP_TIME) || 60 * 60 * 24;
    await new Promise<void>((resolve) => {
      this.client.set(key, value, 'EX', expirationTime, (error) => {
        if (error) console.error(error);
        resolve();
      });
    });
  }
}

export default RedisService;
