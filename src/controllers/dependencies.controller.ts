import { RequestHandler, Request, Response } from 'express';
import NpmRegistryService from '@/services/registry.service';
import { DefaultException } from '@exceptions/default';

class DependenciesController {
  public static get: RequestHandler = async (req: Request, res: Response) => {
    let { scope, packageName, version = 'latest' } = req.params;
    const { scopeOrPackageName, packageNameOrVersion } = req.params;

    if (scopeOrPackageName && scopeOrPackageName.includes('@')) {
      scope = scopeOrPackageName;
      packageName = packageNameOrVersion;
    } else if (scopeOrPackageName) {
      packageName = scopeOrPackageName;
      version = packageNameOrVersion;
    }

    if (scope) packageName = `${scope}/${packageName}`;

    try {
      const dependencyTree = await NpmRegistryService.getDependencyTree(
        packageName,
        version,
      );
      res.json(dependencyTree);
    } catch (e) {
      res
        .status(e.statusCode || DefaultException.statusCode)
        .json({ error: e.description || DefaultException.description });
    }
  };
}

export default DependenciesController;
