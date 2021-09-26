import express from 'express';
import hpp from 'hpp';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

import Routes from './routes/routes';

class App {
  public app: express.Application;
  public port: string | number;
  public env: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.env = process.env.NODE_ENV || 'development';

    this.initMiddleware();
    this.initRoutes();
  }

  private initMiddleware() {
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(morgan());
  }

  private initRoutes() {
    this.app.use(Routes);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.info(`🚀 App listening on port ${this.port}`);
    });
  }
}

export default App;
