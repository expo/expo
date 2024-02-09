/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGDefs_DEFINED
#define SkSVGDefs_DEFINED

#include "modules/svg/include/SkSVGHiddenContainer.h"

class SK_API SkSVGDefs : public SkSVGHiddenContainer {
public:
    static sk_sp<SkSVGDefs> Make() { return sk_sp<SkSVGDefs>(new SkSVGDefs()); }

private:
    SkSVGDefs() : INHERITED(SkSVGTag::kDefs) {}

    using INHERITED = SkSVGHiddenContainer;
};

#endif // SkSVGDefs_DEFINED
