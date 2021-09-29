# npm-scanner

**npm-scanner** is a simple demo application which resolves and outputs the dependency tree of an input npm package.
This project is based on Typescript, Node.js, Express.js and Redis.

## Installation

### With Docker
As the application relies on Node.js and Redis, the project contains these necessary dependencies bundled through Docker and Docker Compose.
Please refer to the official documentation for installing [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) on your system.
Once both are installed, run the following command in the root of the project directory:

    docker-compose up

The service will be built, launched and served by default on `localhost:3000`.

### Without Docker
The project can also be installed and served without the usage of Docker.
Please make sure to have [Node.js](https://nodejs.org/en/download/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/) installed on your system.
The application also requires a Redis instance running, which can be [installed locally](https://redis.io/topics/quickstart) or on a cloud provider.
Once these requirements are met, open the root of the project in a terminal and run the following command to install the necessary package dependencies:

    npm install

If your Redis instance is served on a different URL than the default `redis://localhost:6379`, you must set the value of `REDIS_URL` in your system environment variables to point to the correct instance.

To run the app in development mode, run the command:

    npm run dev

To run the app in production mode, run:

    npm run build && npm run start

The app will be served by default on `localhost:3000`.

## Usage
The application is a REST service which takes a package name and an optional version and returns its dependency tree in JSON format.

There is only one GET endpoint, `/dependencies`, which accepts different input paths for specifying scope, package name and version, consistently with the `https://registry.npmjs.org/` API.

The possible sub-paths are:

    GET /dependencies/:packageName
**e.g.* /dependencies/async*

    GET /dependencies/:packageName/:version
**e.g.* /dependencies/async/2.0.1* or **/dependencies/async/latest*

    GET /dependencies/:scope/:packageName
**e.g.* /dependencies/@snyk/protect*

    GET /dependencies/:scope/:packageName/:version
**e.g.* /dependencies/@snyk/protect/1.720.0*

Please note that omitting the package version will default to use the `latest` tag version.


## Brainstorming notes

### Cache
- Caching improves performance for the user and reduces system load/costs, but decreases accuracy (e.g. patch version updates) thus security. Adjusting caching expiration time acts as a lever between performance and accuracy. Reduced or no caching possible opportunity for monetization from a product perspective?

- External cache opens the possibility of asynchronous workers. e.g. top K most popular packages can be fully re-scanned (without cache reads) multiple times a day and updated in cache.

### Architecture
- Response JSON structure: show all dependencies in root, only nest dependency to parent when there is a conflicting version (this is how npm and `node_modules` work)?

- Handling and displaying dependency cycles.

- Error handling: report that a specific node failed fetching instead of crashing the whole response?

- Progress feedback or real time updates during scan: maybe use WebSockets approach for pushing to the client an in-progress tree JSON to the client as it gets built at each node step. The GET endpoint can immediately return a scan UUID to use with the WebSockets endpoint?

- Analytics: it would be useful to to keep track of the most frequently accessed packages. Can be achieved with an internal monitoring service (update at every package scan) or by processing the logs once a day/week/month?
