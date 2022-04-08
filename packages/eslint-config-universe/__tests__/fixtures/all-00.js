import 'hi';

import a from 'a';
import { b } from 'b';
import c, { c1 } from 'c';
import * as d from 'd';

import e from './e';

export * as f from './f';

export class Example {
  static s = {
    a,
    b,
  };

  m = {};
  #n = null;
  x = 1_000;
  y = 100n;

  hi() {
    _fn() ?? this.byeAsync();
    this.m &&= {};
    Example.s?.a?.();

    try {
      _fn();
    } catch (e) {
      _fn();
    }

    try {
      _fn();
    } catch (_ignored) {
      _fn();
    }

    this.#privateMethod();
  }

  async byeAsync() {
    let f = 1;
    _fn(a, b, c, c1, d, e, f);


    await import('z');
    
    for await (const v of gen()) {
      _fn(v);
    }
  }

  #privateMethod() {}
}

function _fn() {}

function *gen() {}
