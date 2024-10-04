/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_TYPE
#define SKSL_DSL_TYPE

#include "include/core/SkSpan.h"
#include "include/core/SkTypes.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLModifiers.h"
#include "include/sksl/SkSLPosition.h"

#include <cstdint>
#include <string_view>
#include <utility>

namespace SkSL {

class Compiler;
class Type;

namespace dsl {

class DSLField;
class DSLVarBase;

enum TypeConstant : uint8_t {
    kBool_Type,
    kBool2_Type,
    kBool3_Type,
    kBool4_Type,
    kHalf_Type,
    kHalf2_Type,
    kHalf3_Type,
    kHalf4_Type,
    kHalf2x2_Type,
    kHalf3x2_Type,
    kHalf4x2_Type,
    kHalf2x3_Type,
    kHalf3x3_Type,
    kHalf4x3_Type,
    kHalf2x4_Type,
    kHalf3x4_Type,
    kHalf4x4_Type,
    kFloat_Type,
    kFloat2_Type,
    kFloat3_Type,
    kFloat4_Type,
    kFragmentProcessor_Type,
    kFloat2x2_Type,
    kFloat3x2_Type,
    kFloat4x2_Type,
    kFloat2x3_Type,
    kFloat3x3_Type,
    kFloat4x3_Type,
    kFloat2x4_Type,
    kFloat3x4_Type,
    kFloat4x4_Type,
    kInt_Type,
    kInt2_Type,
    kInt3_Type,
    kInt4_Type,
    kShader_Type,
    kShort_Type,
    kShort2_Type,
    kShort3_Type,
    kShort4_Type,
    kUInt_Type,
    kUInt2_Type,
    kUInt3_Type,
    kUInt4_Type,
    kUShort_Type,
    kUShort2_Type,
    kUShort3_Type,
    kUShort4_Type,
    kVoid_Type,
    kPoison_Type,
};

class DSLType {
public:
    DSLType(TypeConstant tc, Position pos = {});

    DSLType(const SkSL::Type* type, Position pos = {});

    DSLType(std::string_view name, Position pos = {});

    DSLType(std::string_view name,
            DSLModifiers* modifiers,
            Position pos = {});

    /**
     * Returns true if the SkSL type is non-null.
     */
    bool hasValue() const { return fSkSLType != nullptr; }

    /**
     * Returns true if this type is a bool.
     */
    bool isBoolean() const;

    /**
     * Returns true if this is a numeric scalar type.
     */
    bool isNumber() const;

    /**
     * Returns true if this is a floating-point scalar type (float or half).
     */
    bool isFloat() const;

    /**
     * Returns true if this is a signed scalar type (int or short).
     */
    bool isSigned() const;

    /**
     * Returns true if this is an unsigned scalar type (uint or ushort).
     */
    bool isUnsigned() const;

    /**
     * Returns true if this is a signed or unsigned integer.
     */
    bool isInteger() const;

    /**
     * Returns true if this is a scalar type.
     */
    bool isScalar() const;

    /**
     * Returns true if this is a vector type.
     */
    bool isVector() const;

    /**
     * Returns true if this is a matrix type.
     */
    bool isMatrix() const;

    /**
     * Returns true if this is a array type.
     */
    bool isArray() const;

    /**
     * Returns true if this is a struct type.
     */
    bool isStruct() const;

    /**
     * Returns true if this is a Skia object type (shader, colorFilter, blender).
     */
    bool isEffectChild() const;

    template<typename... Args>
    static DSLExpression Construct(DSLType type, DSLVarBase& var, Args&&... args) {
        DSLExpression argArray[] = {var, args...};
        return Construct(type, SkSpan(argArray));
    }

    template<typename... Args>
    static DSLExpression Construct(DSLType type, DSLExpression expr, Args&&... args) {
        DSLExpression argArray[] = {std::move(expr), std::move(args)...};
        return Construct(type, SkSpan(argArray));
    }

    static DSLExpression Construct(DSLType type, SkSpan<DSLExpression> argArray);

private:
    const SkSL::Type& skslType() const {
        SkASSERT(fSkSLType);
        return *fSkSLType;
    }

    const SkSL::Type* fSkSLType = nullptr;

    friend DSLType Array(const DSLType& base, int count, Position pos);
    friend DSLType Struct(std::string_view name, SkSpan<DSLField> fields, Position pos);
    friend DSLType UnsizedArray(const DSLType& base, Position pos);
    friend class DSLCore;
    friend class DSLFunction;
    friend class DSLVarBase;
    friend class DSLWriter;
    friend class SkSL::Compiler;
};

#define TYPE(T)                                                                                    \
    template<typename... Args>                                                                     \
    DSLExpression T(Args&&... args) {                                                              \
        return DSLType::Construct(k ## T ## _Type, std::forward<Args>(args)...);                   \
    }

#define VECTOR_TYPE(T)                                                                             \
    TYPE(T)                                                                                        \
    TYPE(T ## 2)                                                                                   \
    TYPE(T ## 3)                                                                                   \
    TYPE(T ## 4)

#define MATRIX_TYPE(T)                                                                             \
    TYPE(T ## 2x2)                                                                                 \
    TYPE(T ## 3x2)                                                                                 \
    TYPE(T ## 4x2)                                                                                 \
    TYPE(T ## 2x3)                                                                                 \
    TYPE(T ## 3x3)                                                                                 \
    TYPE(T ## 4x3)                                                                                 \
    TYPE(T ## 2x4)                                                                                 \
    TYPE(T ## 3x4)                                                                                 \
    TYPE(T ## 4x4)

VECTOR_TYPE(Bool)
VECTOR_TYPE(Float)
VECTOR_TYPE(Half)
VECTOR_TYPE(Int)
VECTOR_TYPE(UInt)
VECTOR_TYPE(Short)
VECTOR_TYPE(UShort)

MATRIX_TYPE(Float)
MATRIX_TYPE(Half)

#undef TYPE
#undef VECTOR_TYPE
#undef MATRIX_TYPE

DSLType Array(const DSLType& base, int count, Position pos = {});

DSLType UnsizedArray(const DSLType& base, Position pos = {});

class DSLField {
public:
    DSLField(const DSLType type, std::string_view name,
             Position pos = {})
        : DSLField(DSLModifiers(), type, name, pos) {}

    DSLField(const DSLModifiers& modifiers, const DSLType type, std::string_view name,
             Position pos = {})
        : fModifiers(modifiers)
        , fType(type)
        , fName(name)
        , fPosition(pos) {}

private:
    DSLModifiers fModifiers;
    const DSLType fType;
    std::string_view fName;
    Position fPosition;

    friend class DSLCore;
    friend DSLType Struct(std::string_view name, SkSpan<DSLField> fields, Position pos);
};

DSLType Struct(std::string_view name, SkSpan<DSLField> fields,
               Position pos = {});

template<typename... Field>
DSLType Struct(std::string_view name, Field... fields) {
    DSLField fieldTypes[] = {std::move(fields)...};
    return Struct(name, SkSpan(fieldTypes), Position());
}

} // namespace dsl

} // namespace SkSL

#endif
