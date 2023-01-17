/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_CASE
#define SKSL_DSL_CASE

#include "include/private/SkSLDefines.h"
#include "include/private/SkTArray.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLStatement.h"
#include "include/sksl/SkSLPosition.h"

#include <utility>

namespace SkSL {

namespace dsl {

class DSLCase {
public:
    // An empty expression means 'default:'.
    template<class... Statements>
    DSLCase(DSLExpression value, Statements... statements)
        : fValue(std::move(value)) {
        fStatements.reserve_back(sizeof...(statements));
        ((void)fStatements.push_back(DSLStatement(std::move(statements)).release()), ...);
    }

    DSLCase(DSLExpression value, SkTArray<DSLStatement> statements,
            Position pos = {});

    DSLCase(DSLExpression value, SkSL::StatementArray statements,
            Position pos = {});

    DSLCase(DSLCase&&);

    ~DSLCase();

    DSLCase& operator=(DSLCase&&);

    void append(DSLStatement stmt);

private:
    DSLExpression fValue;
    SkSL::StatementArray fStatements;
    Position fPosition;

    friend class DSLCore;

    template<class... Cases>
    friend DSLStatement Switch(DSLExpression value, Cases... cases);
};

} // namespace dsl

} // namespace SkSL

#endif
