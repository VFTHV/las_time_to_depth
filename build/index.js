"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LasFileReader_1 = require("./LasFileReader");
// const timeToDepth = new TimeToDepth(
//   new LasFileReader('sulphur_mines_shut_in_depth_final.LAS')
// );
// timeToDepth.convertTimeToDepth();
const myLas = new LasFileReader_1.LasFileReader('sulphur_mines_shut_in_depth_final.LAS');
myLas.read();
