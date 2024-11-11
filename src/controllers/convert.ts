import fs from "fs";
import {
  getAirlineName,
  logFileAction,
  readExcelData,
  sendExcelFile,
  transformData,
  writeExcelFile,
} from "../helpers";
import { Request, Response } from "express";

const convertController = async (req: Request, res: Response) => {
  try {
    const fullName = req.file?.filename;
    if (!fullName) {
      throw new Error("No file uploaded");
    }
    const fullNamePnr = fullName?.split("--");
    //@ts-ignore
    const fullPnr = fullNamePnr[1];
    const finalName = fullPnr.split(" ");
    const airlineCode = finalName[1].toLowerCase(); // Normalize
    const airlineName = getAirlineName(airlineCode);
    const jsonSheet = readExcelData(`./uploads/${fullName}`, "Sheet1");
    const transformedData = transformData(jsonSheet, airlineCode);
    const buffer = writeExcelFile(transformedData);
    // fs.unlink("./uploads/" + fullName, (err) => {
    //   if (err) throw err;
    //   logFileAction(finalName[0], airlineName);
    //   sendExcelFile(
    //     res,
    //     buffer,
    //     `${finalName[0]} ${airlineName} NAMELIST.xlsx`
    //   );
    // });
    logFileAction(finalName[0], airlineName);
    sendExcelFile(res, buffer, `${finalName[0]} ${airlineName} NAMELIST.xlsx`);
  } catch (error) {
    console.error(error);
    return res.json({ error: "Error Converting File", status: 500 });
  }
};

export { convertController };
