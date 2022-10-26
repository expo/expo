/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGTypes_DEFINED
#define SkSVGTypes_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkPath.h"
#include "include/core/SkPoint.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkScalar.h"
#include "include/core/SkSpan.h"
#include "include/core/SkString.h"
#include "include/core/SkTypes.h"
#include "include/private/SkTDArray.h"
#include "src/core/SkTLazy.h"

using SkSVGColorType     = SkColor;
using SkSVGIntegerType   = int;
using SkSVGNumberType    = SkScalar;
using SkSVGStringType    = SkString;
using SkSVGViewBoxType   = SkRect;
using SkSVGTransformType = SkMatrix;
using SkSVGPointsType    = SkTDArray<SkPoint>;

enum class SkSVGPropertyState {
    kUnspecified,
    kInherit,
    kValue,
};

// https://www.w3.org/TR/SVG11/intro.html#TermProperty
template <typename T, bool kInheritable> class SkSVGProperty {
public:
    using ValueT = T;

    SkSVGProperty() : fState(SkSVGPropertyState::kUnspecified) {}

    explicit SkSVGProperty(SkSVGPropertyState state) : fState(state) {}

    explicit SkSVGProperty(const T& value) : fState(SkSVGPropertyState::kValue) {
        fValue.set(value);
    }

    explicit SkSVGProperty(T&& value) : fState(SkSVGPropertyState::kValue) {
        fValue.set(std::move(value));
    }

    template <typename... Args>
    void init(Args&&... args) {
        fState = SkSVGPropertyState::kValue;
        fValue.init(std::forward<Args>(args)...);
    }

    constexpr bool isInheritable() const { return kInheritable; }

    bool isValue() const { return fState == SkSVGPropertyState::kValue; }

    T* getMaybeNull() const {
        return fValue.getMaybeNull();
    }

    void set(SkSVGPropertyState state) {
        fState = state;
        if (fState != SkSVGPropertyState::kValue) {
            fValue.reset();
        }
    }

    void set(const T& value) {
        fState = SkSVGPropertyState::kValue;
        fValue.set(value);
    }

    void set(T&& value) {
        fState = SkSVGPropertyState::kValue;
        fValue.set(std::move(value));
    }

    T* operator->() {
        SkASSERT(fState == SkSVGPropertyState::kValue);
        SkASSERT(fValue.isValid());
        return fValue.get();
    }

    const T* operator->() const {
        SkASSERT(fState == SkSVGPropertyState::kValue);
        SkASSERT(fValue.isValid());
        return fValue.get();
    }

    T& operator*() {
        SkASSERT(fState == SkSVGPropertyState::kValue);
        SkASSERT(fValue.isValid());
        return *fValue;
    }

    const T& operator*() const {
        SkASSERT(fState == SkSVGPropertyState::kValue);
        SkASSERT(fValue.isValid());
        return *fValue;
    }

private:
    SkSVGPropertyState fState;
    SkTLazy<T> fValue;
};

class SkSVGLength {
public:
    enum class Unit {
        kUnknown,
        kNumber,
        kPercentage,
        kEMS,
        kEXS,
        kPX,
        kCM,
        kMM,
        kIN,
        kPT,
        kPC,
    };

    constexpr SkSVGLength()                    : fValue(0), fUnit(Unit::kUnknown) {}
    explicit constexpr SkSVGLength(SkScalar v, Unit u = Unit::kNumber)
        : fValue(v), fUnit(u) {}
    SkSVGLength(const SkSVGLength&)            = default;
    SkSVGLength& operator=(const SkSVGLength&) = default;

    bool operator==(const SkSVGLength& other) const {
        return fUnit == other.fUnit && fValue == other.fValue;
    }
    bool operator!=(const SkSVGLength& other) const { return !(*this == other); }

    const SkScalar& value() const { return fValue; }
    const Unit&     unit()  const { return fUnit;  }

private:
    SkScalar fValue;
    Unit     fUnit;
};

// https://www.w3.org/TR/SVG11/linking.html#IRIReference
class SkSVGIRI {
public:
    enum class Type {
        kLocal,
        kNonlocal,
        kDataURI,
    };

    SkSVGIRI() : fType(Type::kLocal) {}
    SkSVGIRI(Type t, const SkSVGStringType& iri) : fType(t), fIRI(iri) {}

    Type type() const { return fType; }
    const SkSVGStringType& iri() const { return fIRI; }

    bool operator==(const SkSVGIRI& other) const {
        return fType == other.fType && fIRI == other.fIRI;
    }
    bool operator!=(const SkSVGIRI& other) const { return !(*this == other); }

private:
    Type fType;
    SkSVGStringType fIRI;
};

// https://www.w3.org/TR/SVG11/types.html#InterfaceSVGColor
class SkSVGColor {
public:
    enum class Type {
        kCurrentColor,
        kColor,
        kICCColor,
    };
    using Vars = SkSTArray<1, SkString>;

    SkSVGColor() : SkSVGColor(SK_ColorBLACK) {}
    explicit SkSVGColor(const SkSVGColorType& c) : fType(Type::kColor), fColor(c), fVars(nullptr) {}
    explicit SkSVGColor(Type t, Vars&& vars)
        : fType(t), fColor(SK_ColorBLACK)
        , fVars(vars.empty() ? nullptr : new RefCntVars(std::move(vars))) {}
    explicit SkSVGColor(const SkSVGColorType& c, Vars&& vars)
        : fType(Type::kColor), fColor(c)
        , fVars(vars.empty() ? nullptr : new RefCntVars(std::move(vars))) {}

    SkSVGColor(const SkSVGColor&)            = default;
    SkSVGColor& operator=(const SkSVGColor&) = default;
    SkSVGColor(SkSVGColor&&)                 = default;
    SkSVGColor& operator=(SkSVGColor&&)      = default;

    bool operator==(const SkSVGColor& other) const {
        return fType == other.fType && fColor == other.fColor && fVars == other.fVars;
    }
    bool operator!=(const SkSVGColor& other) const { return !(*this == other); }

    Type type() const { return fType; }
    const SkSVGColorType& color() const { SkASSERT(fType == Type::kColor); return fColor; }
    SkSpan<const SkString> vars() const {
        return fVars ? SkMakeSpan<const Vars>(fVars->fData) : SkSpan<const SkString>{nullptr, 0};
    }
    SkSpan<      SkString> vars()       {
        return fVars ? SkMakeSpan<      Vars>(fVars->fData) : SkSpan<      SkString>{nullptr, 0};
    }

private:
    Type fType;
    SkSVGColorType fColor;
    struct RefCntVars : public SkNVRefCnt<RefCntVars> {
        RefCntVars(Vars&& vars) : fData(std::move(vars)) {}
        Vars fData;
    };
    sk_sp<RefCntVars> fVars;
};

class SkSVGPaint {
public:
    enum class Type {
        kNone,
        kColor,
        kIRI,
    };

    SkSVGPaint() : fType(Type::kNone), fColor(SK_ColorBLACK) {}
    explicit SkSVGPaint(Type t) : fType(t), fColor(SK_ColorBLACK) {}
    explicit SkSVGPaint(SkSVGColor c) : fType(Type::kColor), fColor(std::move(c)) {}
    SkSVGPaint(const SkSVGIRI& iri, SkSVGColor fallback_color)
        : fType(Type::kIRI), fColor(std::move(fallback_color)), fIRI(iri) {}

    SkSVGPaint(const SkSVGPaint&)            = default;
    SkSVGPaint& operator=(const SkSVGPaint&) = default;
    SkSVGPaint(SkSVGPaint&&)                 = default;
    SkSVGPaint& operator=(SkSVGPaint&&)      = default;

    bool operator==(const SkSVGPaint& other) const {
        return fType == other.fType && fColor == other.fColor && fIRI == other.fIRI;
    }
    bool operator!=(const SkSVGPaint& other) const { return !(*this == other); }

    Type type() const { return fType; }
    const SkSVGColor& color() const {
        SkASSERT(fType == Type::kColor || fType == Type::kIRI);
        return fColor;
    }
    const SkSVGIRI& iri() const { SkASSERT(fType == Type::kIRI); return fIRI; }

private:
    Type fType;

    // Logical union.
    SkSVGColor fColor;
    SkSVGIRI   fIRI;
};

// <funciri> | none (used for clip/mask/filter properties)
class SkSVGFuncIRI {
public:
    enum class Type {
        kNone,
        kIRI,
    };

    SkSVGFuncIRI() : fType(Type::kNone) {}
    explicit SkSVGFuncIRI(Type t) : fType(t) {}
    explicit SkSVGFuncIRI(SkSVGIRI&& iri) : fType(Type::kIRI), fIRI(std::move(iri)) {}

    bool operator==(const SkSVGFuncIRI& other) const {
        return fType == other.fType && fIRI == other.fIRI;
    }
    bool operator!=(const SkSVGFuncIRI& other) const { return !(*this == other); }

    Type type() const { return fType; }
    const SkSVGIRI& iri() const { SkASSERT(fType == Type::kIRI); return fIRI; }

private:
    Type           fType;
    SkSVGIRI       fIRI;
};

enum class SkSVGLineCap {
    kButt,
    kRound,
    kSquare,
};

class SkSVGLineJoin {
public:
    enum class Type {
        kMiter,
        kRound,
        kBevel,
        kInherit,
    };

    constexpr SkSVGLineJoin() : fType(Type::kInherit) {}
    constexpr explicit SkSVGLineJoin(Type t) : fType(t) {}

    SkSVGLineJoin(const SkSVGLineJoin&)            = default;
    SkSVGLineJoin& operator=(const SkSVGLineJoin&) = default;

    bool operator==(const SkSVGLineJoin& other) const { return fType == other.fType; }
    bool operator!=(const SkSVGLineJoin& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

class SkSVGSpreadMethod {
public:
    // These values must match Skia's SkShader::TileMode enum.
    enum class Type {
        kPad,       // kClamp_TileMode
        kRepeat,    // kRepeat_TileMode
        kReflect,   // kMirror_TileMode
    };

    constexpr SkSVGSpreadMethod() : fType(Type::kPad) {}
    constexpr explicit SkSVGSpreadMethod(Type t) : fType(t) {}

    SkSVGSpreadMethod(const SkSVGSpreadMethod&)            = default;
    SkSVGSpreadMethod& operator=(const SkSVGSpreadMethod&) = default;

    bool operator==(const SkSVGSpreadMethod& other) const { return fType == other.fType; }
    bool operator!=(const SkSVGSpreadMethod& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

class SkSVGFillRule {
public:
    enum class Type {
        kNonZero,
        kEvenOdd,
        kInherit,
    };

    constexpr SkSVGFillRule() : fType(Type::kInherit) {}
    constexpr explicit SkSVGFillRule(Type t) : fType(t) {}

    SkSVGFillRule(const SkSVGFillRule&)            = default;
    SkSVGFillRule& operator=(const SkSVGFillRule&) = default;

    bool operator==(const SkSVGFillRule& other) const { return fType == other.fType; }
    bool operator!=(const SkSVGFillRule& other) const { return !(*this == other); }

    Type type() const { return fType; }

    SkPathFillType asFillType() const {
        SkASSERT(fType != Type::kInherit); // should never be called for unresolved values.
        return fType == Type::kEvenOdd ? SkPathFillType::kEvenOdd : SkPathFillType::kWinding;
    }

private:
    Type fType;
};

class SkSVGVisibility {
public:
    enum class Type {
        kVisible,
        kHidden,
        kCollapse,
        kInherit,
    };

    constexpr SkSVGVisibility() : fType(Type::kVisible) {}
    constexpr explicit SkSVGVisibility(Type t) : fType(t) {}

    SkSVGVisibility(const SkSVGVisibility&)            = default;
    SkSVGVisibility& operator=(const SkSVGVisibility&) = default;

    bool operator==(const SkSVGVisibility& other) const { return fType == other.fType; }
    bool operator!=(const SkSVGVisibility& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

class SkSVGDashArray {
public:
    enum class Type {
        kNone,
        kDashArray,
        kInherit,
    };

    SkSVGDashArray()                : fType(Type::kNone) {}
    explicit SkSVGDashArray(Type t) : fType(t) {}
    explicit SkSVGDashArray(SkTDArray<SkSVGLength>&& dashArray)
        : fType(Type::kDashArray)
        , fDashArray(std::move(dashArray)) {}

    SkSVGDashArray(const SkSVGDashArray&)            = default;
    SkSVGDashArray& operator=(const SkSVGDashArray&) = default;

    bool operator==(const SkSVGDashArray& other) const {
        return fType == other.fType && fDashArray == other.fDashArray;
    }
    bool operator!=(const SkSVGDashArray& other) const { return !(*this == other); }

    Type type() const { return fType; }

    const SkTDArray<SkSVGLength>& dashArray() const { return fDashArray; }

private:
    Type fType;
    SkTDArray<SkSVGLength> fDashArray;
};

class SkSVGStopColor {
public:
    enum class Type {
        kColor,
        kCurrentColor,
        kICCColor,
        kInherit,
    };

    SkSVGStopColor() : fType(Type::kColor), fColor(SK_ColorBLACK) {}
    explicit SkSVGStopColor(Type t) : fType(t), fColor(SK_ColorBLACK) {}
    explicit SkSVGStopColor(const SkSVGColorType& c) : fType(Type::kColor), fColor(c) {}

    SkSVGStopColor(const SkSVGStopColor&)            = default;
    SkSVGStopColor& operator=(const SkSVGStopColor&) = default;

    bool operator==(const SkSVGStopColor& other) const {
        return fType == other.fType && fColor == other.fColor;
    }
    bool operator!=(const SkSVGStopColor& other) const { return !(*this == other); }

    Type type() const { return fType; }
    const SkSVGColorType& color() const { SkASSERT(fType == Type::kColor); return fColor; }

private:
    Type fType;
    SkSVGColorType fColor;
};

class SkSVGObjectBoundingBoxUnits {
public:
    enum class Type {
        kUserSpaceOnUse,
        kObjectBoundingBox,
    };

    SkSVGObjectBoundingBoxUnits() : fType(Type::kUserSpaceOnUse) {}
    explicit SkSVGObjectBoundingBoxUnits(Type t) : fType(t) {}

    bool operator==(const SkSVGObjectBoundingBoxUnits& other) const {
        return fType == other.fType;
    }
    bool operator!=(const SkSVGObjectBoundingBoxUnits& other) const {
        return !(*this == other);
    }

    Type type() const { return fType; }

private:
    Type fType;
};

class SkSVGFontFamily {
public:
    enum class Type {
        kFamily,
        kInherit,
    };

    SkSVGFontFamily() : fType(Type::kInherit) {}
    explicit SkSVGFontFamily(const char family[])
        : fType(Type::kFamily)
        , fFamily(family) {}

    bool operator==(const SkSVGFontFamily& other) const {
        return fType == other.fType && fFamily == other.fFamily;
    }
    bool operator!=(const SkSVGFontFamily& other) const { return !(*this == other); }

    Type type() const { return fType; }

    const SkString& family() const { return fFamily; }

private:
    Type     fType;
    SkString fFamily;
};

class SkSVGFontStyle {
public:
    enum class Type {
        kNormal,
        kItalic,
        kOblique,
        kInherit,
    };

    SkSVGFontStyle() : fType(Type::kInherit) {}
    explicit SkSVGFontStyle(Type t) : fType(t) {}

    bool operator==(const SkSVGFontStyle& other) const {
        return fType == other.fType;
    }
    bool operator!=(const SkSVGFontStyle& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

class SkSVGFontSize {
public:
    enum class Type {
        kLength,
        kInherit,
    };

    SkSVGFontSize() : fType(Type::kInherit), fSize(0) {}
    explicit SkSVGFontSize(const SkSVGLength& s)
        : fType(Type::kLength)
        , fSize(s) {}

    bool operator==(const SkSVGFontSize& other) const {
        return fType == other.fType && fSize == other.fSize;
    }
    bool operator!=(const SkSVGFontSize& other) const { return !(*this == other); }

    Type type() const { return fType; }

    const SkSVGLength& size() const { return fSize; }

private:
    Type        fType;
    SkSVGLength fSize;
};

class SkSVGFontWeight {
public:
    enum class Type {
        k100,
        k200,
        k300,
        k400,
        k500,
        k600,
        k700,
        k800,
        k900,
        kNormal,
        kBold,
        kBolder,
        kLighter,
        kInherit,
    };

    SkSVGFontWeight() : fType(Type::kInherit) {}
    explicit SkSVGFontWeight(Type t) : fType(t) {}

    bool operator==(const SkSVGFontWeight& other) const {
        return fType == other.fType;
    }
    bool operator!=(const SkSVGFontWeight& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

struct SkSVGPreserveAspectRatio {
    enum Align : uint8_t {
        // These values are chosen such that bits [0,1] encode X alignment, and
        // bits [2,3] encode Y alignment.
        kXMinYMin = 0x00,
        kXMidYMin = 0x01,
        kXMaxYMin = 0x02,
        kXMinYMid = 0x04,
        kXMidYMid = 0x05,
        kXMaxYMid = 0x06,
        kXMinYMax = 0x08,
        kXMidYMax = 0x09,
        kXMaxYMax = 0x0a,

        kNone     = 0x10,
    };

    enum Scale {
        kMeet,
        kSlice,
    };

    Align fAlign = kXMidYMid;
    Scale fScale = kMeet;
};

class SkSVGTextAnchor {
public:
    enum class Type {
        kStart,
        kMiddle,
        kEnd,
        kInherit,
    };

    SkSVGTextAnchor() : fType(Type::kInherit) {}
    explicit SkSVGTextAnchor(Type t) : fType(t) {}

    bool operator==(const SkSVGTextAnchor& other) const {
        return fType == other.fType;
    }
    bool operator!=(const SkSVGTextAnchor& other) const { return !(*this == other); }

    Type type() const { return fType; }

private:
    Type fType;
};

// https://www.w3.org/TR/SVG11/filters.html#FilterPrimitiveInAttribute
class SkSVGFeInputType {
public:
    enum class Type {
        kSourceGraphic,
        kSourceAlpha,
        kBackgroundImage,
        kBackgroundAlpha,
        kFillPaint,
        kStrokePaint,
        kFilterPrimitiveReference,
        kUnspecified,
    };

    SkSVGFeInputType() : fType(Type::kUnspecified) {}
    explicit SkSVGFeInputType(Type t) : fType(t) {}
    explicit SkSVGFeInputType(const SkSVGStringType& id)
            : fType(Type::kFilterPrimitiveReference), fId(id) {}

    bool operator==(const SkSVGFeInputType& other) const {
        return fType == other.fType && fId == other.fId;
    }
    bool operator!=(const SkSVGFeInputType& other) const { return !(*this == other); }

    const SkString& id() const {
        SkASSERT(fType == Type::kFilterPrimitiveReference);
        return fId;
    }

    Type type() const { return fType; }

private:
    Type fType;
    SkString fId;
};

enum class SkSVGFeColorMatrixType {
    kMatrix,
    kSaturate,
    kHueRotate,
    kLuminanceToAlpha,
};

using SkSVGFeColorMatrixValues = SkTDArray<SkSVGNumberType>;

enum class SkSVGFeCompositeOperator {
    kOver,
    kIn,
    kOut,
    kAtop,
    kXor,
    kArithmetic,
};

class SkSVGFeTurbulenceBaseFrequency {
public:
    SkSVGFeTurbulenceBaseFrequency() : fFreqX(0), fFreqY(0) {}
    SkSVGFeTurbulenceBaseFrequency(SkSVGNumberType freqX, SkSVGNumberType freqY)
            : fFreqX(freqX), fFreqY(freqY) {}

    SkSVGNumberType freqX() const { return fFreqX; }
    SkSVGNumberType freqY() const { return fFreqY; }

private:
    SkSVGNumberType fFreqX;
    SkSVGNumberType fFreqY;
};

struct SkSVGFeTurbulenceType {
    enum Type {
        kFractalNoise,
        kTurbulence,
    };

    Type fType;

    SkSVGFeTurbulenceType() : fType(kTurbulence) {}
    explicit SkSVGFeTurbulenceType(Type type) : fType(type) {}
};

enum class SkSVGXmlSpace {
    kDefault,
    kPreserve,
};

enum class SkSVGColorspace {
    kAuto,
    kSRGB,
    kLinearRGB,
};

// https://www.w3.org/TR/SVG11/painting.html#DisplayProperty
enum class SkSVGDisplay {
    kInline,
    kNone,
};

#endif // SkSVGTypes_DEFINED
