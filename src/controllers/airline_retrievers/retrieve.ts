import fs from "fs/promises";
import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";

import { spicejetPnrRetrieveUrl, spicejetTokenUrl } from "../../constants";


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

export const getSpiceJetData = async (req: Request, res: Response) => {
  try {
    const pnrs: string[] = req.body;
    const data = await makeApiCall(10);
    const myToken = data.data.data.token;

    const results: string[] = [];
    const errors: string[] = [];
    await Promise.all(
      pnrs.map(async (pnr) => {
        try {
          const config = {
            method: "post",
            url: `${spicejetPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=airlines@airiq.in`,
            headers: {
              Authorization: myToken,
              "Content-Type": "application/json",
            },
          };

          let response: AxiosResponse;
            response = await axios(config); 
          const bookingData = response?.data.bookingData;

          if (bookingData.journeys.length > 0) {
            const IdType = bookingData.contacts.P.sourceOrganization;
            const Email = bookingData.contacts.P.emailAddress;
            const designator = bookingData.journeys[0].designator;
            const flightNumber =
              bookingData.journeys[0].segments[0].identifier.identifier;
            const depSector = designator.origin;
            const arrSector = designator.destination;
            const depDetails = designator.departure.split("T");
            const depTime = checkTimeFormat(depDetails[1].substring(0, 5));
            const arrDetails = designator.arrival.split("T");
            const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));
            const depDate = depDetails[0];
            const paxCount =
              "PAX " + Object.keys(bookingData.passengers).length;
            const PNR = bookingData.recordLocator;
            const payment = bookingData.breakdown.totalCharged;

            // Asynchronous file writing using fs.promises
            try {
              await fs.appendFile(
                "downloads/data.txt",
                `${PNR} ${depSector} ${arrSector} ${flightNumber} ${depDate} ${depTime} ${arrTime} ${paxCount} ${payment} ${IdType} ${Email}\n`,
                "utf8"
              );
            } catch (err) {
              console.error("Error writing to file:", err);
            }

            const result = `${PNR}|${depSector}|${arrSector}|${flightNumber}|${depDate}|${depTime}|${arrTime}|${paxCount}|${payment}|${IdType}|${Email}`;
            results.push(result);
            return result;
          } else {
            const PNR = bookingData?.recordLocator;
            const Email = bookingData?.contacts.P.emailAddress;

            // Asynchronous file writing
            try {
              await fs.appendFile(
                "downloads/data.txt",
                `${PNR} is cancelled ${Email}\n`,
                "utf8"
              );
            } catch (err) {
              console.error("Error writing to file:", err);
            }

            console.log(`${PNR}| is cancelled`);

            const result = `${PNR}| is cancelled`;
            results.push(result);
            return result;
          }
        } catch (error:any) {
          console.error(`Error processing PNR ${pnr}:`, error?.message);
          if (error?.response?.status === 404) {
            errors.push(`PNR ${pnr} not found`); // Add 404 errors to the array
          } else {
            errors.push(`Error processing PNR ${pnr}: ${error?.message}`);
          }
        }
      })
    );

    res.status(200).send({results:results.join("\n"), errors});
  } catch (error) {
    console.error("Error fetching SpiceJet data:", error);
    res.status(500).send(error);
  }
};