/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_VAR
#define SKSL_DSL_VAR

#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLModifiers.h"
#include "include/sksl/DSLType.h"
#include "include/sksl/SkSLPosition.h"

#include <stdint.h>
#include <memory>
#include <string_view>
#include <utility>

namespace SkSL {

class Expression;
class ExpressionArray;
class IRGenerator;
class SPIRVCodeGenerator;
class Statement;
class Variable;
enum class VariableStorage : int8_t;

namespace dsl {

class DSLVarBase {
public:
    /**
     * Creates an empty, unpopulated var. Can be replaced with a real var later via `swap`.
     */
    DSLVarBase() : fType(kVoid_Type), fDeclared(true) {}

    /**
     * Constructs a new variable with the specified type and name. The name is used (in mangled
     * form) in the resulting shader code; it is not otherwise important. Since mangling prevents
     * name conflicts and the variable's name is only important when debugging shaders, the name
     * parameter is optional.
     */
    DSLVarBase(DSLType type, std::string_view name, DSLExpression initialValue, Position pos,
            Position namePos);

    DSLVarBase(DSLType type, DSLExpression initialValue, Position pos, Position namePos);

    DSLVarBase(const DSLModifiers& modifiers, DSLType type, std::string_view name,
               DSLExpression initialValue, Position pos, Position namePos);

    DSLVarBase(const DSLModifiers& modifiers, DSLType type, DSLExpression initialValue,
               Position pos, Position namePos);

    DSLVarBase(DSLVarBase&&) = default;

    virtual ~DSLVarBase();

    std::string_view name() const {
        return fName;
    }

    const DSLModifiers& modifiers() const {
        return fModifiers;
    }

    virtual VariableStorage storage() const = 0;

    DSLExpression x() {
        return DSLExpression(*this, Position()).x();
    }

    DSLExpression y() {
        return DSLExpression(*this, Position()).y();
    }

    DSLExpression z() {
        return DSLExpression(*this, Position()).z();
    }

    DSLExpression w() {
        return DSLExpression(*this, Position()).w();
    }

    DSLExpression r() {
        return DSLExpression(*this, Position()).r();
    }

    DSLExpression g() {
        return DSLExpression(*this, Position()).g();
    }

    DSLExpression b() {
        return DSLExpression(*this, Position()).b();
    }

    DSLExpression a() {
        return DSLExpression(*this, Position()).a();
    }

    DSLExpression field(std::string_view name) {
        return DSLExpression(*this, Position()).field(name);
    }

    DSLPossibleExpression operator[](DSLExpression&& index);

    DSLPossibleExpression operator++() {
        return ++DSLExpression(*this, Position());
    }

    DSLPossibleExpression operator++(int) {
        return DSLExpression(*this, Position())++;
    }

    DSLPossibleExpression operator--() {
        return --DSLExpression(*this, Position());
    }

    DSLPossibleExpression operator--(int) {
        return DSLExpression(*this, Position())--;
    }

protected:
    DSLPossibleExpression assign(DSLExpression other);

    void swap(DSLVarBase& other);

    DSLModifiers fModifiers;
    // We only need to keep track of the type here so that we can create the SkSL::Variable. For
    // predefined variables this field is unnecessary, so we don't bother tracking it and just set
    // it to kVoid; in other words, you shouldn't generally be relying on this field to be correct.
    // If you need to determine the variable's type, look at DSLWriter::Var(...)->type() instead.
    DSLType fType;
    int fUniformHandle = -1;
    std::unique_ptr<SkSL::Statement> fDeclaration;
    const SkSL::Variable* fVar = nullptr;
    Position fNamePosition;
    std::string_view fRawName; // for error reporting
    std::string_view fName;
    DSLExpression fInitialValue;
    // true if we have attempted to create the SkSL var
    bool fInitialized = false;
    bool fDeclared = false;
    Position fPosition;

    friend class DSLCore;
    friend class DSLExpression;
    friend class DSLFunction;
    friend class DSLWriter;
    friend class ::SkSL::IRGenerator;
    friend class ::SkSL::SPIRVCodeGenerator;
};

/**
 * A local variable.
 */
class DSLVar : public DSLVarBase {
public:
    DSLVar() = default;

    DSLVar(DSLType type, std::string_view name = "var",
           DSLExpression initialValue = DSLExpression(),
           Position pos = {}, Position namePos = {})
        : INHERITED(type, name, std::move(initialValue), pos, namePos) {}

    DSLVar(DSLType type, const char* name, DSLExpression initialValue = DSLExpression(),
           Position pos = {}, Position namePos = {})
        : DSLVar(type, std::string_view(name), std::move(initialValue), pos, namePos) {}

    DSLVar(DSLType type, DSLExpression initialValue, Position pos = {}, Position namePos = {})
        : INHERITED(type, std::move(initialValue), pos, namePos) {}

    DSLVar(const DSLModifiers& modifiers, DSLType type, std::string_view name = "var",
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {})
        : INHERITED(modifiers, type, name, std::move(initialValue), pos, namePos) {}

    DSLVar(const DSLModifiers& modifiers, DSLType type, const char* name,
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {})
        : DSLVar(modifiers, type, std::string_view(name), std::move(initialValue), pos, namePos) {}

    DSLVar(DSLVar&&) = default;

    VariableStorage storage() const override;

    void swap(DSLVar& other);

    DSLPossibleExpression operator=(DSLExpression expr);

    DSLPossibleExpression operator=(DSLVar& param) {
        return this->operator=(DSLExpression(param));
    }

    template<class Param>
    DSLPossibleExpression operator=(Param& param) {
        return this->operator=(DSLExpression(param));
    }

private:
    using INHERITED = DSLVarBase;
};

/**
 * A global variable.
 */
class DSLGlobalVar : public DSLVarBase {
public:
    DSLGlobalVar() = default;

    DSLGlobalVar(DSLType type, std::string_view name = "var",
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {})
        : INHERITED(type, name, std::move(initialValue), pos, namePos) {}

    DSLGlobalVar(DSLType type, const char* name, DSLExpression initialValue = DSLExpression(),
                 Position pos = {}, Position namePos = {})
        : DSLGlobalVar(type, std::string_view(name), std::move(initialValue), pos, namePos) {}

    DSLGlobalVar(DSLType type, DSLExpression initialValue,
                 Position pos = {}, Position namePos = {})
        : INHERITED(type, std::move(initialValue), pos, namePos) {}

    DSLGlobalVar(const DSLModifiers& modifiers, DSLType type, std::string_view name = "var",
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {})
        : INHERITED(modifiers, type, name, std::move(initialValue), pos, namePos) {}

    DSLGlobalVar(const DSLModifiers& modifiers, DSLType type, const char* name,
           DSLExpression initialValue = DSLExpression(), Position pos = {}, Position namePos = {})
        : DSLGlobalVar(modifiers, type, std::string_view(name), std::move(initialValue), pos,
                       namePos) {}

    DSLGlobalVar(const char* name);

    DSLGlobalVar(DSLGlobalVar&&) = default;

    VariableStorage storage() const override;

    void swap(DSLGlobalVar& other);

    DSLPossibleExpression operator=(DSLExpression expr);

    DSLPossibleExpression operator=(DSLGlobalVar& param) {
        return this->operator=(DSLExpression(param));
    }

    template<class Param>
    DSLPossibleExpression operator=(Param& param) {
        return this->operator=(DSLExpression(param));
    }

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
    DSLExpression eval(DSLExpression x, DSLExpression y,
            Position pos = {});

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
    DSLParameter() = default;

    DSLParameter(DSLType type, std::string_view name = "var",
                 Position pos = {}, Position namePos = {})
        : INHERITED(type, name, DSLExpression(), pos, namePos) {}

    DSLParameter(DSLType type, const char* name, Position pos = {}, Position namePos = {})
        : DSLParameter(type, std::string_view(name), pos, namePos) {}

    DSLParameter(const DSLModifiers& modifiers, DSLType type, std::string_view name = "var",
                 Position pos = {}, Position namePos = {})
        : INHERITED(modifiers, type, name, DSLExpression(), pos, namePos) {}

    DSLParameter(const DSLModifiers& modifiers, DSLType type, const char* name,
                 Position pos = {}, Position namePos = {})
        : DSLParameter(modifiers, type, std::string_view(name), pos, namePos) {}

    DSLParameter(DSLParameter&&) = default;

    VariableStorage storage() const override;

    void swap(DSLParameter& other);

    DSLPossibleExpression operator=(DSLExpression expr);

    DSLPossibleExpression operator=(DSLParameter& param) {
        return this->operator=(DSLExpression(param));
    }

    template<class Param>
    DSLPossibleExpression operator=(Param& param) {
        return this->operator=(DSLExpression(param));
    }

private:
    using INHERITED = DSLVarBase;
};

} // namespace dsl

} // namespace SkSL


#endif
