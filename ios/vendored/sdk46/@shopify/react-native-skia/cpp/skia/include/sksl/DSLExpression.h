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

#if defined(__has_cpp_attribute) && __has_cpp_attribute(clang::reinitializes)
#define SK_CLANG_REINITIALIZES [[clang::reinitializes]]
#else
#define SK_CLANG_REINITIALIZES
#endif

namespace SkSL {

class Expression;
class ExpressionArray;

namespace dsl {

class DSLPossibleExpression;
class DSLType;
class DSLVarBase;
template <typename T> class DSLWrapper;

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

    DSLExpression(DSLPossibleExpression expr, Position pos = {});

    explicit DSLExpression(std::unique_ptr<SkSL::Expression> expression);

    // If expression is null, returns Poison(pos)
    DSLExpression(std::unique_ptr<SkSL::Expression> expression, Position pos);

    static DSLExpression Poison(Position pos = {});

    ~DSLExpression();

    DSLType type() const;

    std::string description() const;

    Position position() const;

    void setPosition(Position pos);

    /**
     * Overloads the '=' operator to create an SkSL assignment statement.
     */
    DSLPossibleExpression operator=(DSLExpression other);

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
    DSLPossibleExpression operator[](DSLExpression index);

    DSLPossibleExpression operator()(SkTArray<DSLWrapper<DSLExpression>> args,
                                     Position pos = {});

    DSLPossibleExpression operator()(ExpressionArray args,
                                     Position pos = {});

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
    friend class DSLFunction;
    friend class DSLPossibleExpression;
    friend class DSLType;
    friend class DSLVarBase;
    friend class DSLWriter;
    template<typename T> friend class DSLWrapper;
};

DSLPossibleExpression operator+(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator+(DSLExpression expr);
DSLPossibleExpression operator+=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator-(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator-(DSLExpression expr);
DSLPossibleExpression operator-=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator*(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator*=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator/(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator/=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator%(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator%=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator<<(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator<<=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator>>(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator>>=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator&&(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator||(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator&(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator&=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator|(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator|=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator^(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator^=(DSLExpression left, DSLExpression right);
DSLPossibleExpression LogicalXor(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator,(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator,(DSLPossibleExpression left, DSLExpression right);
DSLPossibleExpression operator,(DSLExpression left, DSLPossibleExpression right);
DSLPossibleExpression operator,(DSLPossibleExpression left, DSLPossibleExpression right);
DSLPossibleExpression operator==(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator!=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator>(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator<(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator>=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator<=(DSLExpression left, DSLExpression right);
DSLPossibleExpression operator!(DSLExpression expr);
DSLPossibleExpression operator~(DSLExpression expr);
DSLPossibleExpression operator++(DSLExpression expr);
DSLPossibleExpression operator++(DSLExpression expr, int);
DSLPossibleExpression operator--(DSLExpression expr);
DSLPossibleExpression operator--(DSLExpression expr, int);

/**
 * Represents an Expression which may have failed and/or have pending errors to report. Converting a
 * PossibleExpression into an Expression requires a Position so that any pending errors can be
 * reported at the correct position.
 *
 * PossibleExpression is used instead of Expression in situations where it is not possible to
 * capture the Position at the time of Expression construction (notably in operator overloads, where
 * we cannot add default parameters).
 */
class DSLPossibleExpression {
public:
    DSLPossibleExpression(std::unique_ptr<SkSL::Expression> expression);

    DSLPossibleExpression(DSLPossibleExpression&& other);

    ~DSLPossibleExpression();

    bool valid() const {
        return fExpression != nullptr;
    }

    /**
     * Reports any pending errors at the specified position.
     */
    void reportErrors(Position pos);

    DSLType type() const;

    std::string description() const;

    Position position() const;

    DSLExpression x(Position pos = {});

    DSLExpression y(Position pos = {});

    DSLExpression z(Position pos = {});

    DSLExpression w(Position pos = {});

    DSLExpression r(Position pos = {});

    DSLExpression g(Position pos = {});

    DSLExpression b(Position pos = {});

    DSLExpression a(Position pos = {});

    DSLExpression field(std::string_view name, Position pos = {});

    DSLPossibleExpression operator=(DSLExpression expr);

    DSLPossibleExpression operator=(int expr);

    DSLPossibleExpression operator=(float expr);

    DSLPossibleExpression operator=(double expr);

    DSLPossibleExpression operator[](DSLExpression index);

    DSLPossibleExpression operator()(SkTArray<DSLWrapper<DSLExpression>> args,
                                     Position pos = {});

    DSLPossibleExpression operator()(ExpressionArray args,
                                     Position pos = {});

    DSLPossibleExpression operator++();

    DSLPossibleExpression operator++(int);

    DSLPossibleExpression operator--();

    DSLPossibleExpression operator--(int);

    std::unique_ptr<SkSL::Expression> release(Position pos = {});

private:
    std::unique_ptr<SkSL::Expression> fExpression;

    friend class DSLExpression;
};

} // namespace dsl

} // namespace SkSL

#endif
