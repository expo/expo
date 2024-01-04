/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be found in the LICENSE file.
 */

// SkPoint is part of the public API, but is also required by code in base. The following include
// forwarding allows SkPoint to participate in the API and for use by code in base.

#include "include/private/base/SkPoint_impl.h"  // IWYU pragma: export
