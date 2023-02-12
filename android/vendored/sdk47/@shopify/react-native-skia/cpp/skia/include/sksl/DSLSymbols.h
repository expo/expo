/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_SYMBOLS
#define SKSL_DSL_SYMBOLS

#include "include/sksl/DSLExpression.h"

#include <memory>
#include <string_view>

namespace SkSL {

class Position;
class SymbolTable;

namespace dsl {

class DSLVarBase;

// This header provides methods for manually managing symbol tables in DSL code. They should not be
// used by normal hand-written DSL code, where we rely on C++ to manage symbols, but are instead
// needed when DSL objects are being constructed programmatically (as in DSLParser).

/**
 * Pushes a new symbol table onto the symbol table stack.
 */
void PushSymbolTable();

/**
 * Pops the top symbol table from the stack. As symbol tables are shared pointers, this will only
 * destroy the symbol table if it was never attached to anything (e.g. passed into a Block
 * constructor).
 */
void PopSymbolTable();

/**
 * Returns the current symbol table. Outside of SkSL itself, this is an opaque pointer, used only
 * for passing it to DSL methods that require it.
 */
std::shared_ptr<SymbolTable> CurrentSymbolTable();

/**
 * Returns an expression referring to the named symbol.
 */
DSLExpression Symbol(std::string_view name, Position pos = {});

/**
 * Returns true if the name refers to a type (user or built-in) in the current symbol table.
 */
bool IsType(std::string_view name);

/**
 * Returns true if the name refers to a builtin type.
 */
bool IsBuiltinType(std::string_view name);

/**
 * Adds a variable to the current symbol table.
 */
void AddToSymbolTable(DSLVarBase& var, Position pos = {});

} // namespace dsl

} // namespace SkSL

#endif
