"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LasFileReader = void 0;
const fs_1 = __importDefault(require("fs"));
class LasFileReader {
    // create a fileHeader variable to store the LAS header
    constructor(filename) {
        this.filename = filename;
        this.data = [];
        this.columnHeader = [];
    }
    read() {
        const allData = fs_1.default
            .readFileSync(this.filename, {
            encoding: 'utf-8',
        })
            .replace(/\r/g, '')
            .split('\n')
            .map((row) => {
            return row.split(/ +/);
        });
        this.columnHeader = allData
            .filter((row) => {
            return row.includes('~A');
        })
            .flat();
        this.data = allData
            .filter((row) => !row.includes('~A'))
            .map((row) => {
            return row.map((item) => parseFloat(item));
        });
    }
}
exports.LasFileReader = LasFileReader;
