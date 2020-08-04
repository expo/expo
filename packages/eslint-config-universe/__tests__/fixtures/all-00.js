import 'hi';

import a from 'a';
import { b } from 'b';
import c, { c1 } from 'c';
import * as d from 'd';

import e from './e';

export
@d
class Example {
  static s = {
    a,
    b,
  };

  m = {};

  hi() {
    _fn();
  }

  async byeAsync() {
    let f = 1;
    _fn(a, b, c, c1, d, e, f);
  }
}

function _fn() {}
