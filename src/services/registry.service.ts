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

    const treePath = new Set<string>();

    const deepSearch = async (dependencyNode: DependencyTreeNode) => {
      const { versionsDependencies, distributionTags } =
        await this.getPackageVersions(dependencyNode.packageName);

      dependencyNode.resolvedVersion = this.resolveDependencyVersion(
        dependencyNode.packageName,
        dependencyNode.version,
        Object.keys(versionsDependencies),
        distributionTags,
      );

      const treePathKey = this.getCacheKey(
        dependencyNode.packageName,
        dependencyNode.resolvedVersion,
      );

      if (treePath.has(treePathKey)) {
        dependencyNode.cycle = true;
        return;
      }

      const cachedDependencyNode = await this.fetchDependencyTreeNodeFromCache(
        dependencyNode.packageName,
        dependencyNode.resolvedVersion,
      );

      if (cachedDependencyNode) {
        dependencyNode.dependencies = cachedDependencyNode.dependencies;
        return;
      }

      treePath.add(treePathKey);

      const resolvedVersionDependencies =
        versionsDependencies[dependencyNode.resolvedVersion];

      for (const [dependencyPackageName, dependencyVersion] of Object.entries(
        resolvedVersionDependencies,
      )) {
        const childDependencyNode: DependencyTreeNode = {
          packageName: dependencyPackageName,
          version: dependencyVersion,
          dependencies: [],
        };
        dependencyNode.dependencies.push(childDependencyNode);
        await deepSearch(childDependencyNode);
      }

      treePath.delete(treePathKey);

      this.cacheDependencyTreeNode(dependencyNode);
    };

    await deepSearch(dependencyTree);

    return dependencyTree;
  }

  private static async fetchDependencyTreeNodeFromCache(
    packageName: string,
    version: VersionId,
  ): Promise<DependencyTreeNode | undefined> {
    return await CacheService.get(this.getCacheKey(packageName, version));
  }

  private static async cacheDependencyTreeNode(
    dependencyNode: DependencyTreeNode,
  ): Promise<void> {
    if (!dependencyNode.resolvedVersion) return;
    CacheService.set(
      this.getCacheKey(
        dependencyNode.packageName,
        dependencyNode.resolvedVersion,
      ),
      dependencyNode,
    );
  }

  private static async getPackageVersions(
    packageName: PackageName,
  ): Promise<PackageVersions> {
    let packageVersions: PackageVersions =
      await this.fetchPackageVersionsFromCache(this.getCacheKey(packageName));
    if (!packageVersions) {
      packageVersions = await this.fetchPackageVersionsFromRegistry(
        packageName,
      );
    }

    return packageVersions;
  }

  private static async fetchPackageVersionsFromCache(
    packageName: string,
  ): Promise<PackageVersions | undefined> {
    return await CacheService.get(this.getCacheKey(packageName));
  }

  private static async cachePackageVersions(
    packageName: string,
    versions: PackageVersions,
  ): Promise<void> {
    await CacheService.set(this.getCacheKey(packageName), versions);
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

    const packageVersions = {
      versionsDependencies,
      distributionTags,
    };

    this.cachePackageVersions(packageName, packageVersions);

    return packageVersions;
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

    if (!resolvedVersion) {
      throw VersionNotFoundException(packageName, version);
    }

    return resolvedVersion;
  }

  private static getCacheKey(packageName: string, version?: VersionId): string {
    return packageName + (version ? `@${version}` : '');
  }
}

export default RegistryService;
