import { stringify } from "csv-stringify";
import JSZip from "jszip";
import moment from "moment";
import City from "../models/city";
import {
  getBySensor,
  getHistoryByDate,
  getLastValuesByDate,
  getMaxValuesByDate,
  getMessagesByDate,
} from "../models/data";
import logger from "../utils/logger";

export default {
  async last(req, res) {
    const start = req.params.start;
    const end = req.params.end;

    try {
      const rows = await getLastValuesByDate(start, end);
      res.send({
        result: rows,
      });
    } catch (error) {
      logger.error(error.toString());
      res.send({
        error: "Error",
      });
    }
  },
  async max(req, res) {
    const start = req.params.start;
    const end = req.params.end;
    const type = req.params.type;

    try {
      const rows = await getMaxValuesByDate(start, end, type);
      res.send({
        result: rows,
      });
    } catch (error) {
      logger.error(error.toString());
      res.send({
        error: "Error",
      });
    }
  },
  async messages(req, res) {
    const start = req.params.start;
    const end = req.params.end;

    try {
      const rows = await getMessagesByDate(start, end);
      res.send({
        result: rows,
      });
    } catch (error) {
      logger.error(error.toString());
      res.send({
        error: "Error",
      });
    }
  },
  async cities(req, res) {
    const rows = await City.aggregate([
      {
        $match: {
          city: {
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: "$city",
          country: { $first: "$country" },
          state: { $first: "$state" },
          city: { $first: "$city" },
        },
      },
      {
        $sort: {
          country: 1,
          state: 1,
          city: 1,
        },
      },
    ]);

    const list = {};
    for (const item of rows) {
      if (!list[item.country]) {
        list[item.country] = {};
      }
      if (!list[item.country][item.state]) {
        list[item.country][item.state] = [];
      }
      list[item.country][item.state].push(item.city);
    }

    res.send({
      result: list,
    });
  },
  async csv(req, res) {
    const start = Number(req.params.start);
    const end = Number(req.params.end);

    if (end - start > 6 * 31 * 24 * 60 * 60) {
      return res.send({
        error: "Error. Max period 31 days.",
      });
    }

    try {
      const rows = await getHistoryByDate(start, end);
      const result = [];
      const headers = {
        timestamp: "timestamp",
        sensor_id: "sensor_id",
        sender: "sender",
        geo: "geo",
        pressure: "pressure",
      };
      Object.keys(rows).forEach((sensor) => {
        rows[sensor].forEach((item) => {
          const row = {
            timestamp: moment(item.timestamp, "X").format("DD.MM.YYYY HH:mm"),
            sensor_id: item.sensor_id,
            sender: item.sender,
            geo: item.geo,
          };
          for (const key in item.data) {
            if (!Object.prototype.hasOwnProperty.call(headers, key)) {
              headers[key] = key;
            }
            row[key] = Number(item.data[key]);
          }
          result.push(row);
        });
      });

      stringify(
        result,
        {
          header: true,
          delimiter: ";",
          columns: headers,
          cast: {
            number: function (value) {
              return value.toString().replace(".", ",");
            },
          },
        },
        function (err, output) {
          res.setHeader("Content-Type", "application/zip");
          res.setHeader(
            "Content-disposition",
            'attachment; filename="download-' + Date.now() + '.zip"'
          );
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Pragma", "no-cache");
          var zip = new JSZip();
          zip.file("download-" + Date.now() + ".csv", output);
          zip
            .generateNodeStream({ compression: "DEFLATE", streamFiles: true })
            .pipe(res);
        }
      );
    } catch (error) {
      logger.error(error.toString());
      res.send({
        error: "Error",
      });
    }
  },
  async sensor(req, res) {
    const sensor = req.params.sensor;
    const start = req.params.start;
    const end = req.params.end;

    try {
      const result = await getBySensor(sensor, start, end);

      res.send({
        result,
      });
    } catch (error) {
      logger.error(error.toString());
      res.send({
        error: "Error",
      });
    }
  },
};
