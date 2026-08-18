/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * This file exports a set of constants that are used for Jest's haste map
 * serialization. On very large repositories, the haste map cache becomes very
 * large to the point where it is the largest overhead in starting up Jest.
 *
 * This constant key map allows to keep the map smaller without having to build
 * a custom serialization library.
 */

export interface HType {
  readonly MTIME: 0;
  readonly SIZE: 1;
  readonly VISITED: 2;
  readonly SHA1: 3;
  readonly SYMLINK: 4;
  readonly PLUGINDATA: 5;
  readonly PATH: 0;
  readonly TYPE: 1;
  readonly MODULE: 0;
  readonly PACKAGE: 1;
  readonly GENERIC_PLATFORM: 'g';
  readonly NATIVE_PLATFORM: 'native';
}

export type HTypeValue = 0 | 1 | 2 | 3 | 4 | 5 | 'g' | 'native';

const H: HType = {
  /* file map attributes */
  MTIME: 0,
  SIZE: 1,
  VISITED: 2,
  SHA1: 3,
  SYMLINK: 4,
  PLUGINDATA: 5,

  /* module map attributes */
  PATH: 0,
  TYPE: 1,

  /* module types */
  MODULE: 0,
  PACKAGE: 1,

  /* platforms */
  GENERIC_PLATFORM: 'g',
  NATIVE_PLATFORM: 'native',
};

export default H;
