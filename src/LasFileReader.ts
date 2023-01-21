import fs from 'fs';
import { Las } from 'las-js';

export class LasFileReader {
  data: number[][] = [];
  columnHeader: string[] = [];
  lasHeader: string = '';

  constructor(public filename: string) {}

  read(): void {
    const las = new Las(this.filename);

    const parseLas = async () => {
      try {
        const data = await las.data();
        this.data = data.map((row) =>
          row.map((item) => parseFloat(item.toString()))
        );
        this.columnHeader = await las.header();

        // convert time to depth
        this.timeToDepth();
        this.convertHeader();
        this.depthShift();
        this.putTogether();
      } catch (err) {
        console.log(err);
      }
    };
    parseLas();
  }

  convertHeader(): void {
    const lines = fs
      .readFileSync(this.filename, {
        encoding: 'utf-8',
      })
      .split('\n');

    let header = '';
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('~A')) {
        header += lines[i] + '\n';
      } else {
        break;
      }
    }
    let editHeader = header.replace(/TIME\.SEC/g, 'DEPT.FT');
    editHeader = editHeader.replace(/SEC/g, 'FT');
    editHeader = editHeader.replace('Elapsed Time', 'Depth');
    this.lasHeader = editHeader;
  }

  timeToDepth(): void {
    const depthIndex = this.columnHeader.indexOf('ADPTH');
    const lspdIndex = this.columnHeader.indexOf('LSPD');

    // trim data from non-zero speed, leaving only stations
    // replacing first column with ADPTH curve

    this.columnHeader[0] = 'Depth';
    let curveData = this.data;

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

    this.data = averages;
  }

  depthShift(
    offsetLk1: string,
    offsetLk2: string,
    offsetFl1: string,
    offsetFl2: string
  ): void {
    // create curvelist for each offset
  }

  putTogether(): void {
    // convert averages to string with 4 decimals
    let averagesToString = this.data.map((row) =>
      row.map((item) => item.toFixed(4))
    );
    averagesToString.unshift(this.columnHeader);

    // aligning columns
    let maxChars = averagesToString.flat().reduce(function (a, b) {
      return a.length > b.length ? a : b;
    }).length;

    averagesToString = averagesToString.map((row) =>
      row.map((item) => item.padStart(maxChars + 3, ' '))
    );

    // add column headers

    const outputData = averagesToString.map((row) => row.join('')).join('\n');
    const final = this.lasHeader + outputData;

    fs.writeFileSync('report.LAS', final);
  }

  // depthShift(offsetWLD58, offsetWLD62, offsetWAF1, offsetWAF2): void {}
}
