/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_FUNCTION
#define SKSL_DSL_FUNCTION

#include "include/private/SkSLDefines.h"
#include "include/private/SkTArray.h"
#include "include/sksl/DSLBlock.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLModifiers.h"
#include "include/sksl/DSLStatement.h"
#include "include/sksl/DSLVar.h"
#include "include/sksl/SkSLPosition.h"

#include <string_view>
#include <utility>

namespace SkSL {

class FunctionDeclaration;

namespace dsl {

class DSLType;

class DSLFunction {
public:
    template<class... Parameters>
    DSLFunction(const DSLType& returnType, std::string_view name, Parameters&... parameters)
        : DSLFunction(DSLModifiers(), returnType, name, parameters...) {}

    template<class... Parameters>
    DSLFunction(const DSLModifiers& modifiers, const DSLType& returnType, std::string_view name,
                Parameters&... parameters) {
        SkTArray<DSLParameter*> parameterArray;
        parameterArray.reserve_back(sizeof...(parameters));
        (parameterArray.push_back(&parameters), ...);

        // We can't have a default parameter and a template parameter pack at the same time, so
        // unfortunately we can't capture position from this overload.
        this->init(modifiers, returnType, name, std::move(parameterArray), Position());
    }

    DSLFunction(std::string_view name, const DSLModifiers& modifiers, const DSLType& returnType,
                SkTArray<DSLParameter*> parameters, Position pos = {}) {
        this->init(modifiers, returnType, name, std::move(parameters), pos);
    }

    DSLFunction(SkSL::FunctionDeclaration* decl)
        : fDecl(decl) {}

    virtual ~DSLFunction() = default;

    template<class... Stmt>
    void define(Stmt... stmts) {
        DSLBlock block = DSLBlock(DSLStatement(std::move(stmts))...);
        this->define(std::move(block));
    }

    void define(DSLBlock block, Position pos = {});

    void prototype();

    /**
     * Invokes the function with the given arguments.
     */
    template<class... Args>
    DSLExpression operator()(Args&&... args) {
        ExpressionArray argArray;
        argArray.reserve_back(sizeof...(args));
        this->collectArgs(argArray, std::forward<Args>(args)...);
        return this->call(std::move(argArray));
    }

    /**
     * Invokes the function with the given arguments.
     */
    DSLExpression call(SkTArray<DSLExpression> args, Position pos = {});

    DSLExpression call(ExpressionArray args, Position pos = {});

private:
    void collectArgs(ExpressionArray& args) {}

    template<class... RemainingArgs>
    void collectArgs(ExpressionArray& args, DSLVar& var, RemainingArgs&&... remaining) {
        args.push_back(DSLExpression(var).release());
        collectArgs(args, std::forward<RemainingArgs>(remaining)...);
    }

    template<class... RemainingArgs>
    void collectArgs(ExpressionArray& args, DSLExpression expr, RemainingArgs&&... remaining) {
        args.push_back(expr.release());
        collectArgs(args, std::forward<RemainingArgs>(remaining)...);
    }

    void init(DSLModifiers modifiers, const DSLType& returnType, std::string_view name,
              SkTArray<DSLParameter*> params, Position pos);

    SkSL::FunctionDeclaration* fDecl = nullptr;
    SkSL::Position fPosition;
};

} // namespace dsl

} // namespace SkSL

#endif
