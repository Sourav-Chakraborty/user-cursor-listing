import csv from "csv-parser";
import { Readable } from "stream";

const parseCSV = (buffer: Buffer) => {
  return new Promise((resolve, reject) => {
    try {
      const results: Record<string, any>[] = [];

      const stream = Readable.from(buffer);

      stream
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
        })
        .on("end", () => {
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });

    } catch (error) {
      reject(error);
    }
  });
};

export default parseCSV;