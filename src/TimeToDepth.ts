import { LasFileReader } from './LasFileReader';
import fs from 'fs';
import { CsvStringifier } from 'csv-writer/src/lib/csv-stringifiers/abstract';

interface DataReader {
  read(): void;
  data: number[][];
  columnHeader: string[];
  // later add LasHeader: string
}

export class TimeToDepth {
  static fromLAS(filename: string): TimeToDepth {
    return new TimeToDepth(new LasFileReader(filename));
  }

  outputData: string = '';

  constructor(public reader: DataReader) {}

  convertTimeToDepth(): void {
    this.reader.read();
    const depthIndex = this.reader.columnHeader.indexOf('ADPTH');
    const lspdIndex = this.reader.columnHeader.indexOf('LSPD');

    let curveData = this.reader.data;
    // trim data from non-zero speed (moving data), leaving only stations

    curveData = curveData
      .map((row: number[]): number[] => {
        row[0] = row[depthIndex];
        return row;
      })
      .filter((row: number[]): boolean => {
        return row[lspdIndex] === 0;
      });

    // make average values on same depth
    let sameDepth: number[][] = [];
    let averages: number[][] = [];

    curveData.forEach((row: number[], index: number): void => {
      if (
        (sameDepth.length === 0 ||
          Math.floor(row[0]) ===
            Math.floor(sameDepth[sameDepth.length - 1][0])) &&
        index + 1 !== curveData.length
      ) {
        // push same depth items into sameDepth
        sameDepth.push(row);
      } else {
        // create average for one depth
        const averAtSameDepth: number[] = sameDepth[0].map((_, i) => {
          const avNum: number =
            sameDepth.reduce((acc, arr) => acc + arr[i], 0) / sameDepth.length;
          return Number(avNum.toFixed(4));
        });
        if (sameDepth.length > 50) {
          averages.push(averAtSameDepth);
        }

        sameDepth = [];
        sameDepth.push(row);
      }
    });

    // convert averages to string
    console.log(averages.length);

    averages = averages.map((row) => row.map((item) => item.toFixed(4)));
    this.outputData = averages.map((row) => row.join('     ')).join('\n');

    fs.writeFileSync('report.LAS', this.outputData);
  }
}
