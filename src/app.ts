import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

//Local Imports
import { PORT } from './constants';
import convertRoute from './routes/convert';

const app = express();

//Middleware usage
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
app.use('/convert',convertRoute);

//app listening
app.listen(PORT, ()=>{
    return console.log(`PNR BUDDY is listening at http://localhost:${PORT}`);
})
