import axios from 'axios';
import semver from 'semver';
import {
  DependencyTreeNode,
  PackageName,
  ResolvableVersion,
  VersionId,
  DistributionTag,
} from '../types/npm-registry';

class NpmRegistryService {
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

      const [versionsDependencies, distributionTags] =
        await this._fetchRegistry(dependencyNode.packageName);

      dependencyNode.resolvedVersion = this._resolveDependencyVersion(
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

  private static _resolveDependencyVersion(
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

    return resolvedVersion;
  }

  private static async _fetchRegistry(
    packageName: PackageName,
  ): Promise<
    [
      Record<VersionId, Record<PackageName, ResolvableVersion>>,
      Record<DistributionTag, VersionId>,
    ]
  > {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`,
    );

    const versionsDependencies: Record<
      VersionId,
      Record<PackageName, ResolvableVersion>
    > = {};
    for (const version of Object.keys(response.data.versions)) {
      versionsDependencies[version] =
        response.data.versions[version].dependencies || {};
    }

    const distributionTags: Record<DistributionTag, VersionId> =
      response.data['dist-tags'];

    return [versionsDependencies, distributionTags];
  }
}

export default NpmRegistryService;
