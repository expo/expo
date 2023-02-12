/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_BLOCK
#define SKSL_DSL_BLOCK

#include "include/private/SkSLDefines.h"
#include "include/private/SkTArray.h"
#include "include/sksl/DSLStatement.h"
#include "include/sksl/SkSLPosition.h"

#include <memory>

namespace SkSL {

class Block;
class SymbolTable;

namespace dsl {

class DSLBlock {
public:
    template<class... Statements>
    DSLBlock(Statements... statements) {
        fStatements.reserve_back(sizeof...(statements));
        ((void)fStatements.push_back(DSLStatement(statements.release()).release()), ...);
    }

    DSLBlock(SkSL::StatementArray statements, std::shared_ptr<SymbolTable> symbols = nullptr,
            Position pos = {});

    DSLBlock(SkTArray<DSLStatement> statements, std::shared_ptr<SymbolTable> symbols = nullptr,
            Position pos = {});

    DSLBlock(DSLBlock&& other) = default;
    DSLBlock& operator=(DSLBlock&& other) = default;

    ~DSLBlock() = default;

    void append(DSLStatement stmt);

    std::unique_ptr<SkSL::Block> release();

private:
    SkSL::StatementArray fStatements;
    std::shared_ptr<SkSL::SymbolTable> fSymbols;
    Position fPosition;
};

} // namespace dsl

} // namespace SkSL

#endif
