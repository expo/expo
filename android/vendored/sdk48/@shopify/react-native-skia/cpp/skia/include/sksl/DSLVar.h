/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_VAR
#define SKSL_DSL_VAR

#include "include/private/SkSLStatement.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLModifiers.h"
#include "include/sksl/DSLType.h"
#include "include/sksl/SkSLPosition.h"

#include <cstdint>
#include <memory>
#include <string_view>
#include <utility>

namespace SkSL {

class Expression;
class ExpressionArray;
class Variable;
enum class VariableStorage : int8_t;

namespace dsl {

class DSLVarBase {
public:
    /**
     * Constructs a new variable with the specified type and name.
     */
    DSLVarBase(VariableStorage storage, DSLType type, std::string_view name,
               DSLExpression initialValue, Position pos, Position namePos);

    DSLVarBase(VariableStorage storage, const DSLModifiers& modifiers, DSLType type,
               std::string_view name, DSLExpression initialValue, Position pos, Position namePos);

    DSLVarBase(DSLVarBase&&) = default;

    std::string_view name() const {
        return fName;
    }

    const DSLModifiers& modifiers() const {
        return fModifiers;
    }

    VariableStorage storage() const {
        return fStorage;
    }

    DSLExpression x() {
        return DSLExpression(*this).x();
    }

    DSLExpression y() {
        return DSLExpression(*this).y();
    }

    DSLExpression z() {
        return DSLExpression(*this).z();
    }

    DSLExpression w() {
        return DSLExpression(*this).w();
    }

    DSLExpression r() {
        return DSLExpression(*this).r();
    }

    DSLExpression g() {
        return DSLExpression(*this).g();
    }

    DSLExpression b() {
        return DSLExpression(*this).b();
    }

    DSLExpression a() {
        return DSLExpression(*this).a();
    }

    DSLExpression field(std::string_view name) {
        return DSLExpression(*this).field(name);
    }

    DSLExpression operator[](DSLExpression&& index);

    DSLExpression operator++() {
        return ++DSLExpression(*this);
    }

    DSLExpression operator++(int) {
        return DSLExpression(*this)++;
    }

    DSLExpression operator--() {
        return --DSLExpression(*this);
    }

    DSLExpression operator--(int) {
        return DSLExpression(*this)--;
    }

    template <class T> DSLExpression assign(T&& param) {
        return this->assignExpression(DSLExpression(std::forward<T>(param)));
    }

protected:
    /**
     * Creates an empty, unpopulated var. Can be replaced with a real var later via `swap`.
     */
    DSLVarBase(VariableStorage storage) : fType(kVoid_Type), fStorage(storage) {}

    DSLExpression assignExpression(DSLExpression other);

    void swap(DSLVarBase& other);

    DSLModifiers fModifiers;
    // We only need to keep track of the type here so that we can create the SkSL::Variable. For
    // predefined variables this field is unnecessary, so we don't bother tracking it and just set
    // it to kVoid; in other words, you shouldn't generally be relying on this field to be correct.
    // If you need to determine the variable's type, look at DSLWriter::Var(...)->type() instead.
    DSLType fType;
    std::unique_ptr<SkSL::Statement> fDeclaration;
    SkSL::Variable* fVar = nullptr;
    Position fNamePosition;
    std::string_view fName;
    DSLExpression fInitialValue;
    Position fPosition;
    VariableStorage fStorage;
    bool fInitialized = false;

    friend class DSLCore;
    friend class DSLFunction;
    friend class DSLWriter;
};

/**
 * A local variable.
 */
class DSLVar : public DSLVarBase {
public:
    DSLVar();

    DSLVar(DSLType type, std::string_view name, DSLExpression initialValue = DSLExpression(),
           Position pos = {}, Position namePos = {});

    DSLVar(const DSLModifiers& modifiers, DSLType type, std::string_view name,
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {});

    DSLVar(DSLVar&&) = default;

    void swap(DSLVar& other);

private:
    using INHERITED = DSLVarBase;
};

/**
 * A global variable.
 */
class DSLGlobalVar : public DSLVarBase {
public:
    DSLGlobalVar();

    DSLGlobalVar(DSLType type, std::string_view name, DSLExpression initialValue = DSLExpression(),
                 Position pos = {}, Position namePos = {});

    DSLGlobalVar(const DSLModifiers& modifiers, DSLType type, std::string_view name,
                 DSLExpression initialValue = DSLExpression(),
                 Position pos = {}, Position namePos = {});

    DSLGlobalVar(const char* name);

    DSLGlobalVar(DSLGlobalVar&&) = default;

    void swap(DSLGlobalVar& other);

    /**
     * Implements the following method calls:
     *     half4 shader::eval(float2 coords);
     *     half4 colorFilter::eval(half4 input);
     */
    DSLExpression eval(DSLExpression x, Position pos = {});

    /**
     * Implements the following method call:
     *     half4 blender::eval(half4 src, half4 dst);
     */
    DSLExpression eval(DSLExpression x, DSLExpression y, Position pos = {});

private:
    DSLExpression eval(ExpressionArray args, Position pos);

    std::unique_ptr<SkSL::Expression> methodCall(std::string_view methodName, Position pos);

    using INHERITED = DSLVarBase;
};

/**
 * A function parameter.
 */
class DSLParameter : public DSLVarBase {
public:
    DSLParameter();

    DSLParameter(DSLType type, std::string_view name, Position pos = {}, Position namePos = {});

    DSLParameter(const DSLModifiers& modifiers, DSLType type, std::string_view name,
                 Position pos = {}, Position namePos = {});

    DSLParameter(DSLParameter&&) = default;

    void swap(DSLParameter& other);

private:
    using INHERITED = DSLVarBase;
};

} // namespace dsl

} // namespace SkSL


#endif
