import { Router } from 'express';
import DependenciesController from '../controllers/dependecies.controller';

const DependenciesRoutes = Router();

DependenciesRoutes.get('/:packageName', DependenciesController.get);
DependenciesRoutes.get(
  '/:scopeOrPackageName/:packageNameOrVersion',
  DependenciesController.get,
);
DependenciesRoutes.get(
  '/:scope/:packageName/:version',
  DependenciesController.get,
);

export default DependenciesRoutes;
