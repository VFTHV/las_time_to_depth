"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LasFileReader = void 0;
const fs_1 = __importDefault(require("fs"));
const las_js_1 = require("las-js");
class LasFileReader {
    constructor(filename) {
        this.filename = filename;
        this.data = [];
        this.columnHeader = [];
        this.lasHeader = '';
    }
    read() {
        const las = new las_js_1.Las(this.filename);
        const parseLas = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield las.data();
                this.data = data.map((row) => row.map((item) => parseFloat(item.toString())));
                this.columnHeader = yield las.header();
                // convert time to depth
                this.timeToDepth();
                this.convertHeader();
                this.depthShift();
                this.putTogether();
            }
            catch (err) {
                console.log(err);
            }
        });
        parseLas();
    }
    convertHeader() {
        const lines = fs_1.default
            .readFileSync(this.filename, {
            encoding: 'utf-8',
        })
            .split('\n');
        let header = '';
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].startsWith('~A')) {
                header += lines[i] + '\n';
            }
            else {
                break;
            }
        }
        let editHeader = header.replace(/TIME\.SEC/g, 'DEPT.FT');
        editHeader = editHeader.replace(/SEC/g, 'FT');
        editHeader = editHeader.replace('Elapsed Time', 'Depth');
        editHeader = editHeader
            .replace(/STRT\.FT\s+(-\d+(\.\d+)?):/, `STRT.FT           ${this.data[0][0].toString()}:`)
            .replace(/STOP\.FT\s+(\d+(\.\d+)?):/, `STOP.FT           ${this.data[this.data.length - 1][0].toString()}:`);
        this.lasHeader = editHeader;
        console.log(this.lasHeader);
    }
    timeToDepth() {
        const depthIndex = this.columnHeader.indexOf('ADPTH');
        const lspdIndex = this.columnHeader.indexOf('LSPD');
        // trim data from non-zero speed, leaving only stations
        // replacing first column with ADPTH curve
        this.columnHeader[0] = 'Depth';
        let curveData = this.data;
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
        this.data = averages;
    }
    depthShift(offsetLk1, offsetLk2, offsetFl1, offsetFl2) {
        // create curvelist for each offset
    }
    putTogether() {
        // convert averages to string with 4 decimals
        let averagesToString = this.data.map((row) => row.map((item) => item.toFixed(4)));
        averagesToString.unshift(this.columnHeader);
        // aligning columns
        let maxChars = averagesToString.flat().reduce(function (a, b) {
            return a.length > b.length ? a : b;
        }).length;
        averagesToString = averagesToString.map((row) => row.map((item) => item.padStart(maxChars + 3, ' ')));
        // add column headers
        const stringData = averagesToString.map((row) => row.join('')).join('\n');
        const final = this.lasHeader + stringData;
        fs_1.default.writeFileSync('report.LAS', final);
    }
}
exports.LasFileReader = LasFileReader;
