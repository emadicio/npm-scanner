export type PackageName = string;

export type ResolvableVersion = string;
export type VersionId = string;
export type DistributionTag = string;

export type DependencyTreeNode = {
  packageName: PackageName;
  version: ResolvableVersion;
  resolvedVersion?: VersionId;
  dependencies: DependencyTreeNode[];
};
