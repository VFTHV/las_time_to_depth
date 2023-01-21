import { LasFileReader } from './LasFileReader';
import { TimeToDepth } from './TimeToDepth';

// const timeToDepth = new TimeToDepth(
//   new LasFileReader('sulphur_mines_shut_in_depth_final.LAS')
// );
// timeToDepth.convertTimeToDepth();
const myLas = new LasFileReader('sulphur_mines_shut_in_depth_final.LAS');
myLas.read();
