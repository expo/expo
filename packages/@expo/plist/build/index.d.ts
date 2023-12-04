/// <reference types="node" />
import { XMLToStringOptions } from 'xmlbuilder';
import { build } from './build';
import { parse } from './parse';
export declare type PlistValue = string | number | boolean | Date | Buffer | PlistObject | PlistArray;
export interface PlistObject {
    readonly [x: string]: PlistValue;
}
export interface PlistArray extends ReadonlyArray<PlistValue> {
}
export declare type PlistBuildOptions = XMLToStringOptions;
declare const _default: {
    parse: typeof parse;
    build: typeof build;
};
export default _default;
