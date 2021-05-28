import Sequelize from "sequelize";
import config from "../config";
import logger from "../services/logger";

// const sequelize = new Sequelize({
//   dialect: "sqlite",
//   storage: config.PATH_DB,
//   logging: config.DEBUG ? (msg) => logger.debug(msg) : false,
// });

const sequelize = new Sequelize(
  config.DB.name,
  config.DB.user,
  config.DB.password,
  {
    dialect: "mysql",
    host: config.DB.host,
    logging: config.DEBUG ? (msg) => logger.debug(msg) : false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.model = {};

export default db;
