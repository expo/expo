import { decode, encode } from 'base-64';

globalThis.btoa = encode;
globalThis.atob = decode;
