/*
 * Copyright 2018 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

// We want SkSpan to be a public API, but it is also fundamental to many of our internal types.
// Thus, we have a public file that clients can include. This file defers to the private copy
// so we do not have a dependency cycle from our "base" files to our "core" files.

#include "include/private/base/SkSpan_impl.h" // IWYU pragma: export

