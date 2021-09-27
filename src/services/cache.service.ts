import RedisService from '@services/redis.service';

class CacheService {
  public static async init(): Promise<void> {
    await RedisService.init();
  }

  public static async get(key: string): Promise<any> {
    const value = await RedisService.get(key);
    if (value) return JSON.parse(value);
    return null;
  }

  public static async set(key: string, value: any): Promise<void> {
    await RedisService.set(key, JSON.stringify(value));
  }
}

export default CacheService;
