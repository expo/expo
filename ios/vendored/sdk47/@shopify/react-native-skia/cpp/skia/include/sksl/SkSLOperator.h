/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_OPERATOR
#define SKSL_OPERATOR

#include <cstdint>
#include <string_view>

namespace SkSL {

class Context;
class Type;

enum class OperatorKind : uint8_t {
    PLUS,
    MINUS,
    STAR,
    SLASH,
    PERCENT,
    SHL,
    SHR,
    LOGICALNOT,
    LOGICALAND,
    LOGICALOR,
    LOGICALXOR,
    BITWISENOT,
    BITWISEAND,
    BITWISEOR,
    BITWISEXOR,
    EQ,
    EQEQ,
    NEQ,
    LT,
    GT,
    LTEQ,
    GTEQ,
    PLUSEQ,
    MINUSEQ,
    STAREQ,
    SLASHEQ,
    PERCENTEQ,
    SHLEQ,
    SHREQ,
    BITWISEANDEQ,
    BITWISEOREQ,
    BITWISEXOREQ,
    PLUSPLUS,
    MINUSMINUS,
    COMMA
};

enum class OperatorPrecedence : uint8_t {
    kParentheses    =  1,
    kPostfix        =  2,
    kPrefix         =  3,
    kMultiplicative =  4,
    kAdditive       =  5,
    kShift          =  6,
    kRelational     =  7,
    kEquality       =  8,
    kBitwiseAnd     =  9,
    kBitwiseXor     = 10,
    kBitwiseOr      = 11,
    kLogicalAnd     = 12,
    kLogicalXor     = 13,
    kLogicalOr      = 14,
    kTernary        = 15,
    kAssignment     = 16,
    kSequence       = 17,
    kTopLevel       = kSequence
};

class Operator {
public:
    using Kind = OperatorKind;

    Operator(Kind op) : fKind(op) {}

    Kind kind() const { return fKind; }

    bool isEquality() const {
        return fKind == Kind::EQEQ || fKind == Kind::NEQ;
    }

    OperatorPrecedence getBinaryPrecedence() const;

    // Returns the operator name surrounded by the expected whitespace for a tidy binary expression.
    const char* operatorName() const;

    // Returns the operator name without any surrounding whitespace.
    std::string_view tightOperatorName() const;

    // Returns true if op is '=' or any compound assignment operator ('+=', '-=', etc.)
    bool isAssignment() const;

    // Given a compound assignment operator, returns the non-assignment version of the operator
    // (e.g. '+=' becomes '+')
    Operator removeAssignment() const;

    /**
     * Defines the set of relational (comparison) operators:
     *     <  <=  >  >=
     */
    bool isRelational() const;

    /**
     * Defines the set of operators which are only valid on integral types:
     *   <<  <<=  >>  >>=  &  &=  |  |=  ^  ^=  %  %=
     */
    bool isOnlyValidForIntegralTypes() const;

    /**
     * Defines the set of operators which perform vector/matrix math.
     *   +  +=  -  -=  *  *=  /  /=  %  %=  <<  <<=  >>  >>=  &  &=  |  |=  ^  ^=
     */
    bool isValidForMatrixOrVector() const;

    /*
     * Defines the set of operators allowed by The OpenGL ES Shading Language 1.00, Section 5.1.
     * The set of illegal (reserved) operators are the ones that only make sense with integral
     * types. This is not a coincidence: It's because ES2 doesn't require 'int' to be anything but
     * syntactic sugar for floats with truncation after each operation.
     */
    bool isAllowedInStrictES2Mode() const {
        return !this->isOnlyValidForIntegralTypes();
    }

    /**
     * Determines the operand and result types of a binary expression. Returns true if the
     * expression is legal, false otherwise. If false, the values of the out parameters are
     * undefined.
     */
    bool determineBinaryType(const Context& context,
                             const Type& left,
                             const Type& right,
                             const Type** outLeftType,
                             const Type** outRightType,
                             const Type** outResultType) const;

private:
    bool isOperator() const;
    bool isMatrixMultiply(const Type& left, const Type& right) const;

    Kind fKind;
};

}  // namespace SkSL

#endif
