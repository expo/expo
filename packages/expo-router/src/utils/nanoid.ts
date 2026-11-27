/**
 * Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
 *
 * This source code is licensed under the MIT license.
 *
 * https://github.com/ai/nanoid/blob/3.3.18/non-secure/index.js
 */

const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export function nanoid(): string {
  let id = '';
  let i = 21;
  while (i-- > 0) {
    id += urlAlphabet[(Math.random() * 64) | 0];
  }
  return id;
}
