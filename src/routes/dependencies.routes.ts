import { Router } from 'express';
import DependenciesController from '@controllers/dependencies.controller';

const DependenciesRoutes = Router();

// E.g. /dependencies/express
DependenciesRoutes.get('/:packageName', DependenciesController.get);

// E.g. /dependencies/express/4.17.0
// or   /dependencies/express/latest
// or   /dependencies/@loopback/rest
DependenciesRoutes.get(
  '/:scopeOrPackageName/:packageNameOrVersion',
  DependenciesController.get,
);

// E.g. /dependencies/@loopback/rest/10.0.0
DependenciesRoutes.get(
  '/:scope/:packageName/:version',
  DependenciesController.get,
);

export default DependenciesRoutes;
