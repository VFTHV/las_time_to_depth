"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeToDepth = void 0;
const LasFileReader_1 = require("./LasFileReader");
const fs_1 = __importDefault(require("fs"));
class TimeToDepth {
    constructor(reader) {
        this.reader = reader;
        this.outputData = '';
    }
    static fromLAS(filename) {
        return new TimeToDepth(new LasFileReader_1.LasFileReader(filename));
    }
    convertTimeToDepth() {
        this.reader.read();
        const depthIndex = this.reader.columnHeader.indexOf('ADPTH');
        const lspdIndex = this.reader.columnHeader.indexOf('LSPD');
        let curveData = this.reader.data;
        // trim data from non-zero speed (moving data), leaving only stations
        curveData = curveData
            .map((row) => {
            row[0] = row[depthIndex];
            return row;
        })
            .filter((row) => {
            return row[lspdIndex] === 0;
        });
        // make average values on same depth
        let sameDepth = [];
        let averages = [];
        curveData.forEach((row, index) => {
            if ((sameDepth.length === 0 ||
                Math.floor(row[0]) ===
                    Math.floor(sameDepth[sameDepth.length - 1][0])) &&
                index + 1 !== curveData.length) {
                // push same depth items into sameDepth
                sameDepth.push(row);
            }
            else {
                // create average for one depth
                const averAtSameDepth = sameDepth[0].map((_, i) => {
                    const avNum = sameDepth.reduce((acc, arr) => acc + arr[i], 0) / sameDepth.length;
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
        fs_1.default.writeFileSync('report.LAS', this.outputData);
    }
}
exports.TimeToDepth = TimeToDepth;
