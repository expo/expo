/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGValue_DEFINED
#define SkSVGValue_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkPath.h"
#include "include/core/SkTypes.h"
#include "include/private/base/SkNoncopyable.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGValue : public SkNoncopyable {
public:
    enum class Type {
        kColor,
        kFilter,
        kLength,
        kNumber,
        kObjectBoundingBoxUnits,
        kPreserveAspectRatio,
        kStopColor,
        kString,
        kTransform,
        kViewBox,
    };

    Type type() const { return fType; }

    template <typename T>
    const T* as() const {
        return fType == T::TYPE ? static_cast<const T*>(this) : nullptr;
    }

protected:
    SkSVGValue(Type t) : fType(t) { }

private:
    Type fType;

    using INHERITED = SkNoncopyable;
};

template <typename T, SkSVGValue::Type ValueType>
class SkSVGWrapperValue final : public SkSVGValue {
public:
    static constexpr Type TYPE = ValueType;

    explicit SkSVGWrapperValue(const T& v)
        : INHERITED(ValueType)
        , fWrappedValue(v) { }

    operator const T&() const { return fWrappedValue; }
    const T* operator->() const { return &fWrappedValue; }

private:
    // Stack-only
    void* operator new(size_t) = delete;
    void* operator new(size_t, void*) = delete;

    const T& fWrappedValue;

    using INHERITED = SkSVGValue;
};

using SkSVGColorValue        = SkSVGWrapperValue<SkSVGColorType    , SkSVGValue::Type::kColor     >;
using SkSVGLengthValue       = SkSVGWrapperValue<SkSVGLength       , SkSVGValue::Type::kLength    >;
using SkSVGTransformValue    = SkSVGWrapperValue<SkSVGTransformType, SkSVGValue::Type::kTransform >;
using SkSVGViewBoxValue      = SkSVGWrapperValue<SkSVGViewBoxType  , SkSVGValue::Type::kViewBox   >;
using SkSVGNumberValue       = SkSVGWrapperValue<SkSVGNumberType   , SkSVGValue::Type::kNumber    >;
using SkSVGStringValue       = SkSVGWrapperValue<SkSVGStringType   , SkSVGValue::Type::kString    >;
using SkSVGStopColorValue    = SkSVGWrapperValue<SkSVGStopColor    , SkSVGValue::Type::kStopColor >;

using SkSVGPreserveAspectRatioValue    = SkSVGWrapperValue<SkSVGPreserveAspectRatio,
                                                           SkSVGValue::Type::kPreserveAspectRatio>;

using SkSVGObjectBoundingBoxUnitsValue = SkSVGWrapperValue<SkSVGObjectBoundingBoxUnits,
                                                           SkSVGValue::Type::kObjectBoundingBoxUnits>;

#endif // SkSVGValue_DEFINED
