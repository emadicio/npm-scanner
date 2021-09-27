import express, { Application } from 'express';
import hpp from 'hpp';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

import CacheService from '@services/cache.service';
import Routes from '@routes/routes';

class App {
  public app: Application;
  public port: string | number;
  public env: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.env = process.env.NODE_ENV || 'development';
  }

  public async init(): Promise<void> {
    this.initMiddleware();
    this.initRoutes();
    await this.initServices();
  }

  private initMiddleware() {
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(morgan('tiny'));
  }

  private initRoutes() {
    this.app.use(Routes);
  }

  private async initServices() {
    await CacheService.init();
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.info(`🚀 App listening on port ${this.port}`);
    });
  }
}

export default App;
