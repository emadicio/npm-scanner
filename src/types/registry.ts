// Name of the NPM Package including scope
export type PackageName = string;

// Package version as specified in package.json
// E.g. ^2.10.1 or 2.10.1 or latest
export type ResolvableVersion = string;

// Specific package version identifier
export type VersionId = string;

// E.g. latest or next
export type DistributionTag = string;

export type DependencyTreeNode = {
  packageName: PackageName;
  version: ResolvableVersion;
  resolvedVersion?: VersionId;
  dependencies: DependencyTreeNode[];

  // Whether the package is the start of a dependency cycle
  cycle?: boolean;
};

// Map of a package versions, their corresponding dependencies
// and its distributions tags
export type PackageVersions = {
  versionsDependencies: Record<
    VersionId,
    Record<PackageName, ResolvableVersion>
  >;
  distributionTags: Record<DistributionTag, VersionId>;
};
