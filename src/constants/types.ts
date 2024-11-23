interface AkasaJourney {
  designator: {
    destination: string;
    origin: string;
    departure: string;
    arrival: string;
  };
  segments: { flightReference: string }[];
}

interface AkasaBreakdown {
  passengers: Record<string, unknown>;
  totalAmount: number;
}

interface AkasaData {
  recordLocator: string;
  journeys: AkasaJourney[];
  breakdown: AkasaBreakdown;
}

interface AkasaResponse {
  data: {
    token: string;
    data?: AkasaData; // Optional since data might not be present in all responses
  };
}

interface AirAsiaPnrData {
  pnr: string;
  email: string;
}

interface AirAsiaFlightData {
  pnr: string;
  sector: string;
  departureTime: string;
  arrivalTime: string;
  flightno: string;
  status: string;
  paymentStatus: string;
  pax: number;
  flight_status: string;
  remarks: string | null;
}

export {
  AkasaBreakdown,
  AkasaData,
  AkasaJourney,
  AkasaResponse,
  AirAsiaFlightData,
  AirAsiaPnrData,
}
