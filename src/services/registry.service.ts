import { npmRegistryUrl } from 'config';
import semver from 'semver';
import FetchService from '@services/fetch.service';
import CacheService from '@services/cache.service';
import {
  PackageNotFoundException,
  VersionNotFoundException,
} from '@exceptions/dependencies';
import {
  DependencyTreeNode,
  PackageVersions,
  PackageName,
  ResolvableVersion,
  VersionId,
  DistributionTag,
} from '@/types/registry';

class RegistryService {
  public static async getDependencyTree(
    packageName: PackageName,
    version: ResolvableVersion,
  ): Promise<DependencyTreeNode> {
    const dependencyTree: DependencyTreeNode = {
      packageName,
      version,
      dependencies: [],
    };

    const stack: DependencyTreeNode[] = [dependencyTree];

    while (stack.length) {
      const dependencyNode = stack.pop();

      const { versionsDependencies, distributionTags } =
        await this.getPackageVersions(dependencyNode.packageName);

      dependencyNode.resolvedVersion = this.resolveDependencyVersion(
        dependencyNode.packageName,
        dependencyNode.version,
        Object.keys(versionsDependencies),
        distributionTags,
      );

      const resolvedVersionDependencies =
        versionsDependencies[dependencyNode.resolvedVersion];

      for (const [dependencyPackageName, dependencyVersion] of Object.entries(
        resolvedVersionDependencies,
      )) {
        dependencyNode.dependencies.push({
          packageName: dependencyPackageName,
          version: dependencyVersion,
          dependencies: [],
        });
      }

      stack.push(...dependencyNode.dependencies);
    }

    return dependencyTree;
  }

  private static async getPackageVersions(
    packageName: PackageName,
  ): Promise<PackageVersions> {
    let packageVersions: PackageVersions =
      await this.fetchPackageVersionsFromCache(packageName);
    if (!packageVersions) {
      packageVersions = await this.fetchPackageVersionsFromRegistry(
        packageName,
      );
    }

    return packageVersions;
  }

  private static async fetchPackageVersionsFromCache(
    packageName: string,
  ): Promise<PackageVersions> {
    return await CacheService.get(packageName);
  }

  private static async fetchPackageVersionsFromRegistry(
    packageName: string,
  ): Promise<PackageVersions> {
    let data;
    try {
      data = await FetchService.get(
        npmRegistryUrl.replace('{packageName}', packageName),
      );
    } catch {
      throw PackageNotFoundException(packageName);
    }

    const versionsDependencies: Record<
      VersionId,
      Record<PackageName, ResolvableVersion>
    > = {};
    for (const version of Object.keys(data.versions)) {
      versionsDependencies[version] = data.versions[version].dependencies || {};
    }

    const distributionTags: Record<DistributionTag, VersionId> =
      data['dist-tags'];

    CacheService.set(packageName, { versionsDependencies, distributionTags });

    return { versionsDependencies, distributionTags };
  }

  private static resolveDependencyVersion(
    packageName: string,
    version: ResolvableVersion,
    versions: VersionId[],
    distributionTags: Record<DistributionTag, VersionId>,
  ): VersionId {
    let resolvedVersion: string | undefined;

    if (versions.includes(version)) {
      resolvedVersion = version;
    } else if (semver.validRange(version)) {
      resolvedVersion = semver.maxSatisfying(versions, version);
    } else if (version in distributionTags) {
      resolvedVersion = distributionTags[version];
    }

    if (!resolvedVersion) throw VersionNotFoundException(packageName, version);

    return resolvedVersion;
  }
}

export default RegistryService;
