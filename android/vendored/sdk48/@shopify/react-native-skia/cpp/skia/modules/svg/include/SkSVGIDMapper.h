/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGIDMapper_DEFINED
#define SkSVGIDMapper_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/SkTHash.h"

class SkString;
class SkSVGNode;

using SkSVGIDMapper = SkTHashMap<SkString, sk_sp<SkSVGNode>>;

#endif // SkSVGIDMapper_DEFINED
