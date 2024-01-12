/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkCPUTypes_DEFINED
#define SkCPUTypes_DEFINED

// TODO(bungeman,kjlubick) There are a lot of assumptions throughout the codebase that
//   these types are 32 bits, when they could be more or less. Public APIs should stop
//   using these. Internally, we could use uint_fast8_t and uint_fast16_t, but not in
//   public APIs due to ABI incompatibilities.

/** Fast type for unsigned 8 bits. Use for parameter passing and local
    variables, not for storage
*/
typedef unsigned U8CPU;

/** Fast type for unsigned 16 bits. Use for parameter passing and local
    variables, not for storage
*/
typedef unsigned U16CPU;

#endif
