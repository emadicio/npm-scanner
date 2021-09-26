import { RequestHandler, Request, Response } from 'express';
import NpmRegistryService from '../services/npm-registry.service';

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

    const dependencyTree = await NpmRegistryService.getDependencyTree(
      packageName,
      version,
    );

    res.json({ dependencyTree });
  };
}

export default DependenciesController;
