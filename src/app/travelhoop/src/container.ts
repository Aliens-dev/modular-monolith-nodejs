import { asFunction, asValue, createContainer } from "awilix";
import { createLogger, registerAsArray } from "@travelhoop/infrastructure";
import { Application } from "express";
import * as http from "http";
import { AppModule } from "@travelhoop/infrastructure-types";
import { MikroORM } from "@mikro-orm/core";
import { createApp } from "./app";
import { AppConfig } from "./config/config";
import { errorHandler } from "./middleware/error-handler";
import { DbConfig } from "./config/db-config";

interface ContainerDependencies {
  appConfig: AppConfig;
  dbConfig: DbConfig;
  appModules: AppModule[];
}

export const setupContainer = async ({ appConfig, appModules, dbConfig }: ContainerDependencies) => {
  const container = createContainer();

  const dbConnection = await MikroORM.init(dbConfig);

  container.register({
    port: asValue(appConfig.app.port),
    app: asFunction(createApp),
    logger: asValue(createLogger(process.env)),
    errorHandler: asFunction(errorHandler),
    modules: registerAsArray<any>(appModules.map(appModule => asValue(appModule))),
    dbConnection: asValue(dbConnection),
  });

  container.register({
    app: asFunction(createApp).singleton(),
  });

  const app: Application = container.resolve("app");

  container.register({
    server: asValue(http.createServer(app)),
  });

  return container;
};
