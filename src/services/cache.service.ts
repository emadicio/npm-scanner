import RedisService from '@services/redis.service';
import { CacheItem } from '@/types/cache';

class CacheService {
  public static async init(): Promise<void> {
    await RedisService.init();
  }

  public static async get(key: string): Promise<CacheItem | null> {
    const data = await RedisService.get(key);
    if (data) return { data: JSON.parse(data) };
    return null;
  }

  public static async set(key: string, value: any): Promise<void> {
    await RedisService.set(key, JSON.stringify(value));
  }
}

export default CacheService;
