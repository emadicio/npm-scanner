import RegistryService from '@services/registry.service';
import RedisService from '@services/redis.service';

jest.mock('@services/redis.service');

describe('RegistryService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('#cachePackageVersions and #fetchPackageVersionsFromCache', () => {
    const mockPackageName = 'my-package';
    const mockPackageVersions = {
      versionsDependencies: {
        '0.0.1': {
          'dependency-a': '^1.0.0',
          'dependency-b': '^2.0.5',
        },
        '1.1.0': {
          'dependency-a': '^2.0.0',
          'dependency-b': '^3.0.5',
        },
        '1.1.1': {
          'dependency-a': '^3.0.0',
          'dependency-b': '^4.0.5',
        },
      },
      distributionTags: {
        latest: '1.1.1',
        release: '1.1.0',
      },
    };

    it('set and get package versions map in cache correctly', async () => {
      const mockRedisCache = {};

      RedisService['set'] = jest.fn(async (key, value) => {
        mockRedisCache[key] = value;
      });

      RedisService['get'] = jest.fn(async (key) => {
        return mockRedisCache[key];
      });

      await RegistryService['cachePackageVersions'](
        mockPackageName,
        mockPackageVersions,
      );

      expect(
        await RegistryService['fetchPackageVersionsFromCache'](mockPackageName),
      ).toMatchObject(mockPackageVersions);
    });
  });

  describe('#resolveDependencyVersion', () => {
    const mockPackageName = 'my-package';
    const mockDependencyVersions = [
      '0.0.1',
      '0.0.2',
      '1.0.0-alpha',
      '1.0.0',
      '1.0.1',
      '2.0.0-alpha',
    ];
    const mockDistributionTags = {
      latest: '1.0.1',
      next: '2.0.0-alpha',
    };

    it('resolves specific versions correctly', () => {
      expect(
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          '1.0.0',
          mockDependencyVersions,
          mockDistributionTags,
        ),
      ).toBe('1.0.0');

      expect(
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          '1.0.0-alpha',
          mockDependencyVersions,
          mockDistributionTags,
        ),
      ).toBe('1.0.0-alpha');
    });

    it('resolves distribution tags correctly', () => {
      expect(
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          'next',
          mockDependencyVersions,
          mockDistributionTags,
        ),
      ).toBe('2.0.0-alpha');
    });

    it('resolves range versions correctly', () => {
      expect(
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          '^1.0.0',
          mockDependencyVersions,
          mockDistributionTags,
        ),
      ).toBe('1.0.1');

      expect(
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          '<1.0.1',
          mockDependencyVersions,
          mockDistributionTags,
        ),
      ).toBe('1.0.0');
    });

    it('throws version not found exception when version not resolved', () => {
      expect(() => {
        RegistryService['resolveDependencyVersion'](
          mockPackageName,
          '3.0.0',
          mockDependencyVersions,
          mockDistributionTags,
        );
      }).toThrowError();
    });
  });

  describe('#getCacheKey', () => {
    const mockPackageName = 'my-package';
    const mockVersion = '1.1.0';
    it('generates package only key cache correctly', () => {
      expect(RegistryService['getCacheKey'](mockPackageName)).toBe(
        mockPackageName,
      );
    });

    it('generates package and version cache key correctly', () => {
      expect(RegistryService['getCacheKey'](mockPackageName, mockVersion)).toBe(
        `${mockPackageName}@${mockVersion}`,
      );
    });
  });
});
