/*
* Copyright 2015 Google Inc.
*
* Use of this source code is governed by a BSD-style license that can be
* found in the LICENSE file.
*/

#ifndef SkTableColorFilter_DEFINED
#define SkTableColorFilter_DEFINED

#include "include/core/SkColorFilter.h"

// (DEPRECATED) These factory functions are deprecated. Please use the ones in
// SkColorFilters (i.e., Table and TableARGB).
class SK_API SkTableColorFilter {
public:
    static sk_sp<SkColorFilter> Make(const uint8_t table[256]) {
        return SkColorFilters::Table(table);
    }

    static sk_sp<SkColorFilter> MakeARGB(const uint8_t tableA[256],
                                         const uint8_t tableR[256],
                                         const uint8_t tableG[256],
                                         const uint8_t tableB[256]) {
        return SkColorFilters::TableARGB(tableA, tableR, tableG, tableB);
    }
};

#endif
