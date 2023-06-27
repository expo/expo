/*
 * Copyright 2007 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkColorMatrixFilter_DEFINED
#define SkColorMatrixFilter_DEFINED

#include "include/core/SkColorFilter.h"

// (DEPRECATED) This factory function is deprecated. Please use the one in
// SkColorFilters (i.e., Lighting).
class SK_API SkColorMatrixFilter : public SkColorFilter {
public:
    static sk_sp<SkColorFilter> MakeLightingFilter(SkColor mul, SkColor add) {
        return SkColorFilters::Lighting(mul, add);
    }
};

#endif
