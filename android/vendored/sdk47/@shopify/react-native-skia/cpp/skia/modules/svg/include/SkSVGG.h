/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGG_DEFINED
#define SkSVGG_DEFINED

#include "modules/svg/include/SkSVGContainer.h"

class SkSVGG : public SkSVGContainer {
public:
    static sk_sp<SkSVGG> Make() { return sk_sp<SkSVGG>(new SkSVGG()); }

private:
    SkSVGG() : INHERITED(SkSVGTag::kG) { }

    using INHERITED = SkSVGContainer;
};

#endif // SkSVGG_DEFINED
