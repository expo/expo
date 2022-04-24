import 'hi';

import a from 'a';
import { b } from 'b';
import c, { c1 } from 'c';
import * as d from 'd';

import e from './e';

@d
export class Example {
  static s = {
    a,
    b,
  };

  m: object = {};
  m: object = {};

  hi(): void {
    _fn();

    try {
      _fn();
    } catch (_notIgnored) {
      _fn();
    }
  }

  async byeAsync(): Promise<void> {
    _fn(a, b, c, c1, d, e);
  }
}

function _fn(...args: any): void {}
