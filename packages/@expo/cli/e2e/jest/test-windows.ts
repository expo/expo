/* eslint-disable no-var */
import { platform } from 'node:process';

global['itNotWindows'] = platform === 'win32' ? it.skip : it;
global['testNotWindows'] = platform === 'win32' ? test.skip : test;

declare global {
  /** Run a test case on any platform except Windows */
  var itNotWindows: jest.It;
  /** Run a test case on any platform except Windows */
  var testNotWindows: jest.It;
}

export {};
