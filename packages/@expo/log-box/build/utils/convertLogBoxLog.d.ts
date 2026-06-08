import { LogBoxLog } from '../Data/LogBoxLog';
export declare function convertToExpoLogBoxLog({ symbolicated, symbolicatedComponentStack, codeFrame, componentCodeFrame, ...log }: any): LogBoxLog;
export declare function convertNativeToExpoLogBoxLog({ message, stack }: any): LogBoxLog;
