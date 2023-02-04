/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_EXPRESSION
#define SKSL_DSL_EXPRESSION

#include "include/private/SkTArray.h"
#include "include/sksl/SkSLOperator.h"
#include "include/sksl/SkSLPosition.h"

#include <cstdint>
#include <memory>
#include <string>
#include <string_view>
#include <type_traits>

#if defined(__has_cpp_attribute) && __has_cpp_attribute(clang::reinitializes)
#define SK_CLANG_REINITIALIZES [[clang::reinitializes]]
#else
#define SK_CLANG_REINITIALIZES
#endif

namespace SkSL {

class Expression;
class ExpressionArray;

namespace dsl {

class DSLType;
class DSLVarBase;

/**
 * Represents an expression such as 'cos(x)' or 'a + b'.
 */
class DSLExpression {
public:
    DSLExpression(const DSLExpression&) = delete;

    DSLExpression(DSLExpression&&);

    DSLExpression();

    /**
     * Creates an expression representing a literal float.
     */
    DSLExpression(float value, Position pos = {});

    /**
     * Creates an expression representing a literal float.
     */
    DSLExpression(double value, Position pos = {})
        : DSLExpression((float) value) {}

    /**
     * Creates an expression representing a literal int.
     */
    DSLExpression(int value, Position pos = {});

    /**
     * Creates an expression representing a literal int.
     */
    DSLExpression(int64_t value, Position pos = {});

    /**
     * Creates an expression representing a literal uint.
     */
    DSLExpression(unsigned int value, Position pos = {});

    /**
     * Creates an expression representing a literal bool.
     */
    DSLExpression(bool value, Position pos = {});

    /**
     * Creates an expression representing a variable reference.
     */
    DSLExpression(DSLVarBase& var, Position pos = {});

    DSLExpression(DSLVarBase&& var, Position pos = {});

    // If expression is null, returns Poison
    explicit DSLExpression(std::unique_ptr<SkSL::Expression> expression, Position pos = {});

    static DSLExpression Poison(Position pos = {});

    ~DSLExpression();

    DSLType type() const;

    std::string description() const;

    Position position() const;

    void setPosition(Position pos);

    /**
     * Performs assignment, like the '=' operator.
     */
    DSLExpression assign(DSLExpression other);

    DSLExpression x(Position pos = {});

    DSLExpression y(Position pos = {});

    DSLExpression z(Position pos = {});

    DSLExpression w(Position pos = {});

    DSLExpression r(Position pos = {});

    DSLExpression g(Position pos = {});

    DSLExpression b(Position pos = {});

    DSLExpression a(Position pos = {});

    /**
     * Creates an SkSL struct field access expression.
     */
    DSLExpression field(std::string_view name, Position pos = {});

    /**
     * Creates an SkSL array index expression.
     */
    DSLExpression operator[](DSLExpression index);

    DSLExpression operator()(SkTArray<DSLExpression, true> args, Position pos = {});

    DSLExpression operator()(ExpressionArray args, Position pos = {});

    /**
     * Invokes a prefix operator.
     */
    DSLExpression prefix(Operator::Kind op, Position pos);

    /**
     * Invokes a postfix operator.
     */
    DSLExpression postfix(Operator::Kind op, Position pos);

    /**
     * Invokes a binary operator.
     */
    DSLExpression binary(Operator::Kind op, DSLExpression right, Position pos);

    /**
     * Equivalent to operator[].
     */
    DSLExpression index(DSLExpression index, Position pos);

    /**
     * Returns true if this object contains an expression. DSLExpressions which were created with
     * the empty constructor or which have already been release()ed do not have a value.
     * DSLExpressions created with errors are still considered to have a value (but contain poison).
     */
    bool hasValue() const {
        return fExpression != nullptr;
    }

    /**
     * Returns true if this object contains an expression which is not poison.
     */
    bool isValid() const;

    SK_CLANG_REINITIALIZES void swap(DSLExpression& other);

    /**
     * Invalidates this object and returns the SkSL expression it represents. It is an error to call
     * this on an invalid DSLExpression.
     */
    std::unique_ptr<SkSL::Expression> release();

private:
    /**
     * Calls release if this expression has a value, otherwise returns null.
     */
    std::unique_ptr<SkSL::Expression> releaseIfPossible();

    std::unique_ptr<SkSL::Expression> fExpression;

    friend DSLExpression SampleChild(int index, DSLExpression coords);

    friend class DSLCore;
    friend class DSLVarBase;
    friend class DSLWriter;
};

DSLExpression operator+(DSLExpression left, DSLExpression right);
DSLExpression operator+(DSLExpression expr);
DSLExpression operator+=(DSLExpression left, DSLExpression right);
DSLExpression operator-(DSLExpression left, DSLExpression right);
DSLExpression operator-(DSLExpression expr);
DSLExpression operator-=(DSLExpression left, DSLExpression right);
DSLExpression operator*(DSLExpression left, DSLExpression right);
DSLExpression operator*=(DSLExpression left, DSLExpression right);
DSLExpression operator/(DSLExpression left, DSLExpression right);
DSLExpression operator/=(DSLExpression left, DSLExpression right);
DSLExpression operator%(DSLExpression left, DSLExpression right);
DSLExpression operator%=(DSLExpression left, DSLExpression right);
DSLExpression operator<<(DSLExpression left, DSLExpression right);
DSLExpression operator<<=(DSLExpression left, DSLExpression right);
DSLExpression operator>>(DSLExpression left, DSLExpression right);
DSLExpression operator>>=(DSLExpression left, DSLExpression right);
DSLExpression operator&&(DSLExpression left, DSLExpression right);
DSLExpression operator||(DSLExpression left, DSLExpression right);
DSLExpression operator&(DSLExpression left, DSLExpression right);
DSLExpression operator&=(DSLExpression left, DSLExpression right);
DSLExpression operator|(DSLExpression left, DSLExpression right);
DSLExpression operator|=(DSLExpression left, DSLExpression right);
DSLExpression operator^(DSLExpression left, DSLExpression right);
DSLExpression operator^=(DSLExpression left, DSLExpression right);
DSLExpression LogicalXor(DSLExpression left, DSLExpression right);
DSLExpression operator,(DSLExpression left, DSLExpression right);
DSLExpression operator==(DSLExpression left, DSLExpression right);
DSLExpression operator!=(DSLExpression left, DSLExpression right);
DSLExpression operator>(DSLExpression left, DSLExpression right);
DSLExpression operator<(DSLExpression left, DSLExpression right);
DSLExpression operator>=(DSLExpression left, DSLExpression right);
DSLExpression operator<=(DSLExpression left, DSLExpression right);
DSLExpression operator!(DSLExpression expr);
DSLExpression operator~(DSLExpression expr);
DSLExpression operator++(DSLExpression expr);
DSLExpression operator++(DSLExpression expr, int);
DSLExpression operator--(DSLExpression expr);
DSLExpression operator--(DSLExpression expr, int);

} // namespace dsl

} // namespace SkSL

template <typename T> struct sk_is_trivially_relocatable;

template <>
struct sk_is_trivially_relocatable<SkSL::dsl::DSLExpression> : std::true_type {};

#endif
