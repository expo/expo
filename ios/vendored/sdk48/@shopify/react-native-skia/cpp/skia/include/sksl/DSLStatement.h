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

class DSLStatement {
public:
    DSLStatement();

    DSLStatement(DSLExpression expr);

    DSLStatement(DSLBlock block);

    DSLStatement(DSLStatement&&) = default;

    DSLStatement(std::unique_ptr<SkSL::Expression> expr);

    DSLStatement(std::unique_ptr<SkSL::Statement> stmt, Position pos);

    DSLStatement(std::unique_ptr<SkSL::Statement> stmt);

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

    friend class DSLCore;
    friend class DSLWriter;
    friend DSLStatement operator,(DSLStatement left, DSLStatement right);
};

DSLStatement operator,(DSLStatement left, DSLStatement right);

} // namespace dsl

} // namespace SkSL

#endif
