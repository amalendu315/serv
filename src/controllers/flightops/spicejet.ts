import { Request, Response } from "express";
import { environment, spicejetPnrRetrieveUrl, spicejetTokenUrl } from "../../constants";
import axios, { AxiosResponse } from "axios";
import * as xlsx from "xlsx";
import moment from "moment-timezone";
import https from "https";

const TokenConfig = {
  method: "post",
  url: spicejetTokenUrl,
  headers: { "Content-Type": "application/json" },
};

const makeApiCall = async (
  maxAttempts: number,
  currentAttempt = 1
): Promise<AxiosResponse<any>> => {
  return axios(TokenConfig)
    .then((response) => {
      if (response.data.data.token.length > 0) {
        return response;
      } else if (currentAttempt < maxAttempts) {
        return makeApiCall(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached");
      }
    })
    .catch((error) => {
      console.log("Trying To Fetch Authorization Key");
      return makeApiCall(maxAttempts, currentAttempt + 1);
    });
};

const checkTimeFormat = (text: string): string => {
  if (
    text.charAt(0) === "0" ||
    text.slice(0, 2) === "11" ||
    text.slice(0, 2) === "10"
  ) {
    return text.concat(" ", "AM");
  } else {
    return text.concat(" ", "PM");
  }
};

export const getSpicejetStatus = async (req: Request, res: Response) => {
    try {
       const data = await makeApiCall(10);
       const myToken = data?.data?.data.token;
       const fullName = req.file?.filename;

       if (!fullName) {
         return res.status(400).send({ error: "No file uploaded" });
       }

       const wb = xlsx.readFile("./uploads/" + fullName, { cellDates: true });
       const ws = wb.Sheets["Sheet1"];
       ws["!ref"] = "A1:K3000"; // Adjust the range if necessary
       const jsonSheet = xlsx.utils.sheet_to_json(ws);
        const allResults = await Promise.all(
          jsonSheet.map(async (record: any) => {
            const PNR = record?.PNR;
            const config1 = {
              method: "get",
              url: `${spicejetPnrRetrieveUrl}?recordLocator=${PNR}&emailAddress=airlines@airiq.in`,
              headers: {
                Authorization: myToken,
                "Content-Type": "application/json",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
              httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            };
            // let response: AxiosResponse<any>;
            //   response = await axios(config1);
            //   if (!response || !response.data || !response.data.data || response === undefined || response.data.length < 0) {
            //     throw new Error(`Invalid API response for PNR ${PNR}`);
            //   }
            
            try {

              const response = await axios(config1);

              if (
                !response ||
                !response.data ||
                !response.data.data ||
                response === undefined ||
                response.data.length < 0
              ) {
                throw new Error(`Invalid API response for PNR ${PNR}`);
              }
              const bookingData = response.data.data;
              const journeys = bookingData.journeys;
              const length = journeys?.length;

              if (length > 0) {
                const designator = bookingData.journeys[0].designator;
                const flightNumber =
                  bookingData.journeys[0].segments[0].identifier.identifier;
                const depSector = designator.origin;
                const arrSector = designator.destination;
                const depDetails = designator.departure.split("T");
                const depDate = depDetails[0];
                const depTime = checkTimeFormat(depDetails[1].substring(0, 5));
                const arrDetails = designator.arrival.split("T");
                const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));

                const PAX = Object.keys(bookingData.passengers).length;

                const OldPur = JSON.stringify(record.Pur); //Quantity

                ////departure a-----------------------

                const DepinputTime = record.Dep;
                const date = moment.utc(DepinputTime).tz("Asia/Kolkata");
                const minute = date.minutes();

                const lastDigit = minute % 10;
                let roundedMinutes = 0;
                lastDigit === 0 || lastDigit === 5
                  ? (roundedMinutes = minute)
                  : (roundedMinutes = minute + 1);

                date.minutes(roundedMinutes);

                const OldDep =
                  environment === "development"
                    ? date.format("HH:mm A")
                    : moment(date)
                        .subtract(5, "hours")
                        .subtract(30, "minutes")
                        .format("HH:mm A");;

                ////arrival b-----------------------

                const ArrinputTime = record.Arr;
                const dateb = moment.utc(ArrinputTime).tz("Asia/Kolkata");
                const minuteb = dateb.minutes();

                const lastDigitb = minuteb % 10;
                let roundedMinutesb = 0;
                lastDigitb === 0 || lastDigitb === 5
                  ? (roundedMinutesb = minuteb)
                  : (roundedMinutesb = minuteb + 1);

                dateb.minutes(roundedMinutesb);
                const OldArr =
                  environment === "development"
                    ? dateb.format("HH:mm A")
                    : moment(dateb)
                        .subtract(5, "hours")
                        .subtract(30, "minutes")
                        .format("HH:mm A");;

                const OldDate = moment(record.TravelDate).format("YYYY-MM-DD"); //Date

                const CheckStatus = () => {
                  if (
                    record.Flight != flightNumber ||
                    OldPur != JSON.stringify(PAX) ||
                    OldDate != depDate ||
                    OldDep != depTime ||
                    OldArr != arrTime
                  ) {
                    return "BAD";
                  } else {
                    return "GOOD";
                  }
                };

                const MyRemarks = CheckStatus();
                const result =
                  record.PNR +
                  "|" +
                  depSector +
                  " " +
                  arrSector +
                  "|" +
                  record.Flight +
                  "|" +
                  flightNumber +
                  "|" +
                  OldPur +
                  "|" +
                  PAX +
                  "|" +
                  OldDate +
                  "|" +
                  depDate +
                  "|" +
                  OldDep +
                  "|" +
                  depTime +
                  "|" +
                  OldArr +
                  "|" +
                  arrTime +
                  "|" +
                  MyRemarks;
                return {
                  pnr: record.PNR,
                  data: result,
                };
              } else {
                const PNR = bookingData.recordLocator;
                const result = `${PNR} is Cancelled`;
                return {
                  pnr: record.PNR,
                  error: result,
                };
              }
            } catch (error: any) {
             if (error?.response) {
               let errorMessage = `Error fetching PNR ${PNR}`;
               switch (error.response.status) {
                 case 404:
                   errorMessage = `PNR NOT FOUND ${record.PNR}`;
                   break;
                 case 403:
                   errorMessage = "Access Denied";
                   break;
                 case 500:
                   errorMessage =
                     `Server Error: Unable to process the request for ${PNR}.`;
                   break;
                 // You can add more specific status checks if needed
                 default:
                   errorMessage = `Error: ${error.message} for ${PNR}`;
               }
               return {
                 pnr: record.PNR,
                 error: errorMessage,
               };
             } else {
               return {
                 pnr: record.PNR,
                 error: `Error processing PNR ${record.PNR}: ${error.message}`,
               };
             }
            }
          })
        );
        const { results, errors } = allResults.reduce(
          (acc, result: any) => {
            if (result?.error) {
              acc.errors.push(result?.error);
            } else if (result.data) {
              acc.results.push(result.data);
            }
            return acc;
          },
          { results: [] as string[], errors: [] as string[] }
        );

        res.status(200).send({ results, errors });
    } catch (error:any) {
        console.error("Processing Error: ", error?.message); // Log the error for debugging
        res
          .status(500)
          .send({ error: "There was an error processing your request." });
    }
};
