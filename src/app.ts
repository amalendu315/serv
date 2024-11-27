import cors from "cors";
import express from "express";
import morgan from 'morgan'
import bodyParser from "body-parser";

//Local Imports
import { PORT } from "./constants";
import {
  akasaRoute,
  akasaStatusRoute,
  convertRoute,
  retreiveRoute,
  spicejetStatusRoute,
} from "./routes";

const app = express();


//Middleware usage
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(morgan("tiny"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
app.use("/convert", convertRoute);
app.use("/akasa", akasaRoute);
app.use("/retrieve", retreiveRoute);
app.use("/flightops/spicejet", spicejetStatusRoute);
app.use("/flightops/akasa", akasaStatusRoute);

//app listening
app.listen(PORT, () => {
  return console.log(`PNR BUDDY is listening at http://localhost:${PORT}`);
});
