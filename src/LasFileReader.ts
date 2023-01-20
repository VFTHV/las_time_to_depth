import fs from 'fs';
import { Las } from 'las-js';

export class LasFileReader {
  data: number[][] = [];
  columnHeader: string[] = [];
  // create a fileHeader variable to store the LAS header

  constructor(public filename: string) {}

  read(): void {
    const allData = fs
      .readFileSync(this.filename, {
        encoding: 'utf-8',
      })
      .replace(/\r/g, '')
      .split('\n')
      .map((row: string): string[] => {
        return row.split(/ +/);
      });
    this.columnHeader = allData
      .filter((row: string[]): boolean => {
        return row.includes('~A');
      })
      .flat();
    this.data = allData
      .filter((row: string[]): boolean => !row.includes('~A'))
      .map((row: string[]): number[] => {
        return row.map((item: string): number => parseFloat(item));
      });
  }
}
