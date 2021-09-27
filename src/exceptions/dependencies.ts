import { HttpException } from '@/types/exceptions';

export const PackageNotFoundException = (
  packageName: string,
): HttpException => ({
  statusCode: 404,
  description: `Package '${packageName}' not found.`,
});

export const VersionNotFoundException = (
  packageName: string,
  version: string,
): HttpException => ({
  statusCode: 404,
  description: `Version '${version}' for package '${packageName}' not found.`,
});
