import { Router } from 'express';
import DependenciesRoutes from '@routes/dependencies.routes';

const Routes = Router();

Routes.use('/dependencies', DependenciesRoutes);

export default Routes;
