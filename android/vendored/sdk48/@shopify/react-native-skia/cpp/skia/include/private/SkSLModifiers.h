/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_MODIFIERS
#define SKSL_MODIFIERS

#include "include/private/SkSLLayout.h"

#include <cstddef>
#include <memory>
#include <string>

namespace SkSL {

class Context;
class Position;

/**
 * A set of modifier keywords (in, out, uniform, etc.) appearing before a declaration.
 */
struct Modifiers {
    /**
     * OpenGL requires modifiers to be in a strict order:
     * - invariant-qualifier:     (invariant)
     * - interpolation-qualifier: flat, noperspective, (smooth)
     * - storage-qualifier:       const, uniform
     * - parameter-qualifier:     in, out, inout
     * - precision-qualifier:     highp, mediump, lowp
     *
     * SkSL does not have `invariant` or `smooth`.
     */

    enum Flag {
        kNo_Flag             =       0,
        // Real GLSL modifiers
        kFlat_Flag           = 1 <<  0,
        kNoPerspective_Flag  = 1 <<  1,
        kConst_Flag          = 1 <<  2,
        kUniform_Flag        = 1 <<  3,
        kIn_Flag             = 1 <<  4,
        kOut_Flag            = 1 <<  5,
        kHighp_Flag          = 1 <<  6,
        kMediump_Flag        = 1 <<  7,
        kLowp_Flag           = 1 <<  8,
        kReadOnly_Flag       = 1 <<  9,
        kWriteOnly_Flag      = 1 << 10,
        kBuffer_Flag         = 1 << 11,
        // We use the Metal name for this one (corresponds to the GLSL 'shared' modifier)
        kThreadgroup_Flag    = 1 << 12,
        // SkSL extensions, not present in GLSL
        kExport_Flag         = 1 << 13,
        kES3_Flag            = 1 << 14,
        kPure_Flag           = 1 << 15,
        kInline_Flag         = 1 << 16,
        kNoInline_Flag       = 1 << 17,
    };

    Modifiers()
    : fLayout(Layout())
    , fFlags(0) {}

    Modifiers(const Layout& layout, int flags)
    : fLayout(layout)
    , fFlags(flags) {}

    std::string description() const {
        return fLayout.description() + DescribeFlags(fFlags) + " ";
    }

    static std::string DescribeFlags(int flags) {
        // SkSL extensions
        std::string result;
        if (flags & kExport_Flag) {
            result += "$export ";
        }
        if (flags & kES3_Flag) {
            result += "$es3 ";
        }
        if (flags & kPure_Flag) {
            result += "$pure ";
        }
        if (flags & kInline_Flag) {
            result += "inline ";
        }
        if (flags & kNoInline_Flag) {
            result += "noinline ";
        }

        // Real GLSL qualifiers (must be specified in order in GLSL 4.1 and below)
        if (flags & kFlat_Flag) {
            result += "flat ";
        }
        if (flags & kNoPerspective_Flag) {
            result += "noperspective ";
        }
        if (flags & kConst_Flag) {
            result += "const ";
        }
        if (flags & kUniform_Flag) {
            result += "uniform ";
        }
        if ((flags & kIn_Flag) && (flags & kOut_Flag)) {
            result += "inout ";
        } else if (flags & kIn_Flag) {
            result += "in ";
        } else if (flags & kOut_Flag) {
            result += "out ";
        }
        if (flags & kHighp_Flag) {
            result += "highp ";
        }
        if (flags & kMediump_Flag) {
            result += "mediump ";
        }
        if (flags & kLowp_Flag) {
            result += "lowp ";
        }
        if (flags & kReadOnly_Flag) {
            result += "readonly ";
        }
        if (flags & kWriteOnly_Flag) {
            result += "writeonly ";
        }
        if (flags & kBuffer_Flag) {
            result += "buffer ";
        }

        // We're using a non-GLSL name for this one; the GLSL equivalent is "shared"
        if (flags & kThreadgroup_Flag) {
            result += "threadgroup ";
        }

        if (!result.empty()) {
            result.pop_back();
        }
        return result;
    }

    bool operator==(const Modifiers& other) const {
        return fLayout == other.fLayout && fFlags == other.fFlags;
    }

    bool operator!=(const Modifiers& other) const {
        return !(*this == other);
    }

    /**
     * Verifies that only permitted modifiers and layout flags are included. Reports errors and
     * returns false in the event of a violation.
     */
    bool checkPermitted(const Context& context,
                        Position pos,
                        int permittedModifierFlags,
                        int permittedLayoutFlags) const;

    Layout fLayout;
    int fFlags;
};

} // namespace SkSL

namespace std {

template <>
struct hash<SkSL::Modifiers> {
    size_t operator()(const SkSL::Modifiers& key) const {
        return (size_t) key.fFlags ^ ((size_t) key.fLayout.fFlags << 8) ^
               ((size_t) key.fLayout.fBuiltin << 16);
    }
};

} // namespace std

#endif
