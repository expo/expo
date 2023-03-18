/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_LAYOUT
#define SKSL_DSL_LAYOUT

#include "include/private/SkSLLayout.h"
#include "include/sksl/SkSLPosition.h"

namespace SkSL {

namespace dsl {

class DSLLayout {
public:
    DSLLayout() {}

    DSLLayout& originUpperLeft(Position pos = {}) {
        return this->flag(SkSL::Layout::kOriginUpperLeft_Flag, "origin_upper_left", pos);
    }

    DSLLayout& pushConstant(Position pos = {}) {
        return this->flag(SkSL::Layout::kPushConstant_Flag, "push_constant", pos);
    }

    DSLLayout& blendSupportAllEquations(Position pos = {}) {
        return this->flag(SkSL::Layout::kBlendSupportAllEquations_Flag,
                          "blend_support_all_equations", pos);
    }

    DSLLayout& color(Position pos = {}) {
        return this->flag(SkSL::Layout::kColor_Flag, "color", pos);
    }

    DSLLayout& location(int location, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fLocation, location, SkSL::Layout::kLocation_Flag,
                              "location", pos);
    }

    DSLLayout& offset(int offset, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fOffset, offset, SkSL::Layout::kOffset_Flag, "offset",
                              pos);
    }

    DSLLayout& binding(int binding, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fBinding, binding, SkSL::Layout::kBinding_Flag,
                              "binding", pos);
    }

    DSLLayout& index(int index, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fIndex, index, SkSL::Layout::kIndex_Flag, "index", pos);
    }

    DSLLayout& set(int set, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fSet, set, SkSL::Layout::kSet_Flag, "set", pos);
    }

    DSLLayout& builtin(int builtin, Position pos = {}) {
        return this->intValue(&fSkSLLayout.fBuiltin, builtin, SkSL::Layout::kBuiltin_Flag,
                              "builtin", pos);
    }

    DSLLayout& inputAttachmentIndex(int inputAttachmentIndex,
                                    Position pos = {}) {
        return this->intValue(&fSkSLLayout.fInputAttachmentIndex, inputAttachmentIndex,
                              SkSL::Layout::kInputAttachmentIndex_Flag, "input_attachment_index",
                              pos);
    }

private:
    explicit DSLLayout(SkSL::Layout skslLayout)
        : fSkSLLayout(skslLayout) {}

    DSLLayout& flag(SkSL::Layout::Flag mask, const char* name, Position pos);

    DSLLayout& intValue(int* target, int value, SkSL::Layout::Flag flag, const char* name,
                        Position pos);

    SkSL::Layout fSkSLLayout;

    friend class DSLModifiers;
};

} // namespace dsl

} // namespace SkSL

#endif
