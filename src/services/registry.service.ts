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
  /*
  * Returns the entire dependency tree of a package version
  */
  public static async getDependencyTree(
    packageName: PackageName,
    version: ResolvableVersion,
  ): Promise<DependencyTreeNode> {
    const dependencyTree: DependencyTreeNode = {
      packageName,
      version,
      dependencies: [],
    };

    // Needed to detect dependency cycles
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

      // Dependency cycle detected in path
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

  /*
  * Fetches an individual dependency tree node frome cache
  * It includes all its child dependencies
  */
  private static async fetchDependencyTreeNodeFromCache(
    packageName: string,
    version: VersionId,
  ): Promise<DependencyTreeNode | undefined> {
    return await CacheService.get(this.getCacheKey(packageName, version));
  }

  /*
  * Stores a dependency tree node in the cache
  */
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

  /*
  * Given a package,
  * returns a map of all its available version, their dependencies and dist tags
  */
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

  /*
  * Fetches the available versions of a package from the cache
  */
  private static async fetchPackageVersionsFromCache(
    packageName: string,
  ): Promise<PackageVersions | undefined> {
    return await CacheService.get(this.getCacheKey(packageName));
  }

  /*
  * Caches the available versions of a package
  */
  private static async cachePackageVersions(
    packageName: string,
    versions: PackageVersions,
  ): Promise<void> {
    await CacheService.set(this.getCacheKey(packageName), versions);
  }

  /*
  * Fetches the available versions of a package from the NPM Registry
  */
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

  /*
  * Matches a resolvable version to one of the available versions of a package
  */
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

  /*
  * Returns a unique and consistent cache identifier for a package name and version
  */
  private static getCacheKey(packageName: string, version?: VersionId): string {
    return packageName + (version ? `@${version}` : '');
  }
}

export default RegistryService;
