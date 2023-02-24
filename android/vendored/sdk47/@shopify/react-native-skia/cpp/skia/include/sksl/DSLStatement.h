/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_STATEMENT
#define SKSL_DSL_STATEMENT

#include "include/core/SkTypes.h"
#include "include/private/SkSLStatement.h"
#include "include/sksl/SkSLPosition.h"

#include <memory>
#include <utility>

namespace SkSL {

class Expression;

namespace dsl {

class DSLBlock;
class DSLExpression;
class DSLPossibleExpression;
class DSLPossibleStatement;

class DSLStatement {
public:
    DSLStatement();

    DSLStatement(DSLExpression expr);

    DSLStatement(DSLPossibleExpression expr, Position pos = {});

    DSLStatement(DSLPossibleStatement stmt, Position pos = {});

    DSLStatement(DSLBlock block);

    DSLStatement(DSLStatement&&) = default;

    DSLStatement(std::unique_ptr<SkSL::Statement> stmt);

    DSLStatement(std::unique_ptr<SkSL::Expression> expr);

    ~DSLStatement();

    DSLStatement& operator=(DSLStatement&& other) = default;

    Position position() {
        SkASSERT(this->hasValue());
        return fStatement->fPosition;
    }

    void setPosition(Position pos) {
        SkASSERT(this->hasValue());
        fStatement->fPosition = pos;
    }

    bool hasValue() { return fStatement != nullptr; }

    std::unique_ptr<SkSL::Statement> release() {
        SkASSERT(this->hasValue());
        return std::move(fStatement);
    }

private:
    std::unique_ptr<SkSL::Statement> releaseIfPossible() {
        return std::move(fStatement);
    }

    std::unique_ptr<SkSL::Statement> fStatement;

    friend class DSLBlock;
    friend class DSLCore;
    friend class DSLExpression;
    friend class DSLPossibleStatement;
    friend class DSLWriter;
    friend DSLStatement operator,(DSLStatement left, DSLStatement right);
};

/**
 * Represents a Statement which may have failed and/or have pending errors to report. Converting a
 * PossibleStatement into a Statement requires a Position so that any pending errors can be
 * reported at the correct position.
 *
 * PossibleStatement is used instead of Statement in situations where it is not possible to capture
 * the Position at the time of Statement construction.
 */
class DSLPossibleStatement {
public:
    DSLPossibleStatement(std::unique_ptr<SkSL::Statement> stmt);

    DSLPossibleStatement(DSLPossibleStatement&& other) = default;

    ~DSLPossibleStatement();

    bool hasValue() { return fStatement != nullptr; }

    std::unique_ptr<SkSL::Statement> release() {
        return DSLStatement(std::move(*this)).release();
    }

private:
    std::unique_ptr<SkSL::Statement> fStatement;

    friend class DSLStatement;
};

DSLStatement operator,(DSLStatement left, DSLStatement right);

} // namespace dsl

} // namespace SkSL

#endif
