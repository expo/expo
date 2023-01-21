/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL_CORE
#define SKSL_DSL_CORE

#include "include/private/SkSLDefines.h"
#include "include/private/SkSLProgramKind.h"
#include "include/private/SkTArray.h"
#include "include/sksl/DSLCase.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLStatement.h"
#include "include/sksl/DSLVar.h"
#include "include/sksl/SkSLPosition.h"

#include <memory>
#include <string>
#include <string_view>
#include <utility>

namespace SkSL {

class Compiler;
class ErrorReporter;
struct Program;
struct ProgramSettings;

namespace dsl {

class DSLField;
class DSLModifiers;

// When users import the DSL namespace via `using namespace SkSL::dsl`, we want the SwizzleComponent
// Type enum to come into scope as well, so `Swizzle(var, X, Y, ONE)` can work as expected.
// `namespace SkSL::SwizzleComponent` contains only an `enum Type`; this `using namespace` directive
// shouldn't pollute the SkSL::dsl namespace with anything else.
using namespace SkSL::SwizzleComponent;

/**
 * Starts DSL output on the current thread using the specified compiler. This must be called
 * prior to any other DSL functions.
 */
void Start(SkSL::Compiler* compiler, SkSL::ProgramKind kind = SkSL::ProgramKind::kFragment);

void Start(SkSL::Compiler* compiler, SkSL::ProgramKind kind, const SkSL::ProgramSettings& settings);

/**
 * Signals the end of DSL output. This must be called sometime between a call to Start() and the
 * termination of the thread.
 */
void End();

/**
 * Returns all global elements (functions and global variables) as a self-contained Program. The
 * optional source string is retained as the program's source. DSL programs do not normally have
 * sources, but when a DSL program is produced from parsed program text (as in Parser), it may be
 * important to retain it so that any std::string_views derived from it remain valid.
 */
std::unique_ptr<SkSL::Program> ReleaseProgram(std::unique_ptr<std::string> source = nullptr);

/**
 * Returns the ErrorReporter which will be notified of any errors that occur during DSL calls. The
 * default error reporter aborts on any error.
 */
ErrorReporter& GetErrorReporter();

/**
 * Installs an ErrorReporter which will be notified of any errors that occur during DSL calls.
 */
void SetErrorReporter(ErrorReporter* errorReporter);

DSLGlobalVar sk_FragColor();

DSLGlobalVar sk_FragCoord();

DSLExpression sk_Position();

/**
 * #extension <name> : enable
 */
void AddExtension(std::string_view name, Position pos = {});

/**
 * break;
 */
DSLStatement Break(Position pos = {});

/**
 * continue;
 */
DSLStatement Continue(Position pos = {});

/**
 * Adds a modifiers declaration to the current program.
 */
void Declare(const DSLModifiers& modifiers, Position pos = {});

/**
 * Creates a local variable declaration statement.
 */
DSLStatement Declare(DSLVar& var, Position pos = {});

/**
 * Creates a local variable declaration statement containing multiple variables.
 */
DSLStatement Declare(SkTArray<DSLVar>& vars, Position pos = {});

/**
 * Declares a global variable.
 */
void Declare(DSLGlobalVar& var, Position pos = {});

/**
 * Declares a set of global variables.
 */
void Declare(SkTArray<DSLGlobalVar>& vars, Position pos = {});

/**
 * default: statements
 */
template<class... Statements>
DSLCase Default(Statements... statements) {
    return DSLCase(DSLExpression(), std::move(statements)...);
}

/**
 * discard;
 */
DSLStatement Discard(Position pos = {});

/**
 * do stmt; while (test);
 */
DSLStatement Do(DSLStatement stmt, DSLExpression test, Position pos = {});

/**
 * for (initializer; test; next) stmt;
 */
DSLStatement For(DSLStatement initializer, DSLExpression test, DSLExpression next,
                 DSLStatement stmt, Position pos = {}, ForLoopPositions positions = {});

/**
 * if (test) ifTrue; [else ifFalse;]
 */
DSLStatement If(DSLExpression test, DSLStatement ifTrue, DSLStatement ifFalse = DSLStatement(),
                Position pos = {});

DSLGlobalVar InterfaceBlock(const DSLModifiers& modifiers,  std::string_view typeName,
                            SkTArray<DSLField> fields, std::string_view varName = "",
                            int arraySize = 0, Position pos = {});

/**
 * return [value];
 */
DSLStatement Return(DSLExpression value = DSLExpression(),
                    Position pos = {});

/**
 * test ? ifTrue : ifFalse
 */
DSLExpression Select(DSLExpression test, DSLExpression ifTrue, DSLExpression ifFalse,
                     Position  = {});

DSLStatement StaticIf(DSLExpression test, DSLStatement ifTrue,
                      DSLStatement ifFalse = DSLStatement(),
                      Position pos = {});

// Internal use only
DSLStatement StaticSwitch(DSLExpression value, SkTArray<DSLCase> cases, Position pos = {});

/**
 * @switch (value) { cases }
 */
template<class... Cases>
DSLStatement StaticSwitch(DSLExpression value, Cases... cases) {
    SkTArray<DSLCase> caseArray;
    caseArray.reserve_back(sizeof...(cases));
    (caseArray.push_back(std::move(cases)), ...);
    return StaticSwitch(std::move(value), std::move(caseArray), Position{});
}

// Internal use only
DSLStatement Switch(DSLExpression value, SkTArray<DSLCase> cases, Position pos = {});

/**
 * switch (value) { cases }
 */
template<class... Cases>
DSLStatement Switch(DSLExpression value, Cases... cases) {
    SkTArray<DSLCase> caseArray;
    caseArray.reserve_back(sizeof...(cases));
    (caseArray.push_back(std::move(cases)), ...);
    return Switch(std::move(value), std::move(caseArray), Position{});
}

/**
 * while (test) stmt;
 */
DSLStatement While(DSLExpression test, DSLStatement stmt,
                   Position pos = {});

/**
 * expression.xyz1
 */
DSLExpression Swizzle(DSLExpression base,
                      SkSL::SwizzleComponent::Type a,
                      Position pos = {},
                      Position maskPos = {});

DSLExpression Swizzle(DSLExpression base,
                      SkSL::SwizzleComponent::Type a,
                      SkSL::SwizzleComponent::Type b,
                      Position pos = {},
                      Position maskPos = {});

DSLExpression Swizzle(DSLExpression base,
                      SkSL::SwizzleComponent::Type a,
                      SkSL::SwizzleComponent::Type b,
                      SkSL::SwizzleComponent::Type c,
                      Position pos = {},
                      Position maskPos = {});

DSLExpression Swizzle(DSLExpression base,
                      SkSL::SwizzleComponent::Type a,
                      SkSL::SwizzleComponent::Type b,
                      SkSL::SwizzleComponent::Type c,
                      SkSL::SwizzleComponent::Type d,
                      Position pos = {},
                      Position maskPos = {});

/**
 * Returns the absolute value of x. If x is a vector, operates componentwise.
 */
DSLExpression Abs(DSLExpression x, Position pos = {});

/**
 * Returns true if all of the components of boolean vector x are true.
 */
DSLExpression All(DSLExpression x, Position pos = {});

/**
 * Returns true if any of the components of boolean vector x are true.
 */
DSLExpression Any(DSLExpression x, Position pos = {});

/**
 * Returns the arctangent of y over x. Operates componentwise on vectors.
 */
DSLExpression Atan(DSLExpression y_over_x, Position pos = {});
DSLExpression Atan(DSLExpression y, DSLExpression x, Position pos = {});

/**
 * Returns x rounded towards positive infinity. If x is a vector, operates componentwise.
 */
DSLExpression Ceil(DSLExpression x, Position pos = {});

/**
 * Returns x clamped to between min and max. If x is a vector, operates componentwise.
 */
DSLExpression Clamp(DSLExpression x, DSLExpression min, DSLExpression max,
                    Position pos = {});

/**
 * Returns the cosine of x. If x is a vector, operates componentwise.
 */
DSLExpression Cos(DSLExpression x, Position pos = {});

/**
 * Returns the cross product of x and y.
 */
DSLExpression Cross(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns x converted from radians to degrees. If x is a vector, operates componentwise.
 */
DSLExpression Degrees(DSLExpression x, Position pos = {});

/**
 * Returns the distance between x and y.
 */
DSLExpression Distance(DSLExpression x, DSLExpression y,
                       Position pos = {});

/**
 * Returns the dot product of x and y.
 */
DSLExpression Dot(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are equal to the corresponding
 * components of y.
 */
DSLExpression Equal(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns e^x. If x is a vector, operates componentwise.
 */
DSLExpression Exp(DSLExpression x, Position pos = {});

/**
 * Returns 2^x. If x is a vector, operates componentwise.
 */
DSLExpression Exp2(DSLExpression x, Position pos = {});

/**
 * If dot(i, nref) >= 0, returns n, otherwise returns -n.
 */
DSLExpression Faceforward(DSLExpression n, DSLExpression i, DSLExpression nref,
                          Position pos = {});

/**
 * Returns x rounded towards negative infinity. If x is a vector, operates componentwise.
 */
DSLExpression Floor(DSLExpression x, Position pos = {});

/**
 * Returns the fractional part of x. If x is a vector, operates componentwise.
 */
DSLExpression Fract(DSLExpression x, Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are greater than the corresponding
 * components of y.
 */
DSLExpression GreaterThan(DSLExpression x, DSLExpression y,
                          Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are greater than or equal to the
 * corresponding components of y.
 */
DSLExpression GreaterThanEqual(DSLExpression x, DSLExpression y,
                               Position pos = {});

/**
 * Returns the 1/sqrt(x). If x is a vector, operates componentwise.
 */
DSLExpression Inversesqrt(DSLExpression x, Position pos = {});

/**
 * Returns the inverse of the matrix x.
 */
DSLExpression Inverse(DSLExpression x, Position pos = {});

/**
 * Returns the length of the vector x.
 */
DSLExpression Length(DSLExpression x, Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are less than the corresponding
 * components of y.
 */
DSLExpression LessThan(DSLExpression x, DSLExpression y,
                       Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are less than or equal to the
 * corresponding components of y.
 */
DSLExpression LessThanEqual(DSLExpression x, DSLExpression y,
                            Position pos = {});

/**
 * Returns the log base e of x. If x is a vector, operates componentwise.
 */
DSLExpression Log(DSLExpression x, Position pos = {});

/**
 * Returns the log base 2 of x. If x is a vector, operates componentwise.
 */
DSLExpression Log2(DSLExpression x, Position pos = {});

/**
 * Returns the larger (closer to positive infinity) of x and y. If x is a vector, operates
 * componentwise. y may be either a vector of the same dimensions as x, or a scalar.
 */
DSLExpression Max(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns the smaller (closer to negative infinity) of x and y. If x is a vector, operates
 * componentwise. y may be either a vector of the same dimensions as x, or a scalar.
 */
DSLExpression Min(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns a linear intepolation between x and y at position a, where a=0 results in x and a=1
 * results in y. If x and y are vectors, operates componentwise. a may be either a vector of the
 * same dimensions as x and y, or a scalar.
 */
DSLExpression Mix(DSLExpression x, DSLExpression y, DSLExpression a,
                  Position pos = {});

/**
 * Returns x modulo y. If x is a vector, operates componentwise. y may be either a vector of the
 * same dimensions as x, or a scalar.
 */
DSLExpression Mod(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns the vector x normalized to a length of 1.
 */
DSLExpression Normalize(DSLExpression x, Position pos = {});

/**
 * Returns a boolean vector indicating whether components of x are not equal to the corresponding
 * components of y.
 */
DSLExpression NotEqual(DSLExpression x, DSLExpression y,
                       Position pos = {});

/**
 * Returns x raised to the power y. If x is a vector, operates componentwise. y may be either a
 * vector of the same dimensions as x, or a scalar.
 */
DSLExpression Pow(DSLExpression x, DSLExpression y, Position pos = {});

/**
 * Returns x converted from degrees to radians. If x is a vector, operates componentwise.
 */
DSLExpression Radians(DSLExpression x, Position pos = {});

/**
 * Returns i reflected from a surface with normal n.
 */
DSLExpression Reflect(DSLExpression i, DSLExpression n, Position pos = {});

/**
 * Returns i refracted across a surface with normal n and ratio of indices of refraction eta.
 */
DSLExpression Refract(DSLExpression i, DSLExpression n, DSLExpression eta,
                      Position pos = {});

/**
 * Returns x, rounded to the nearest integer. If x is a vector, operates componentwise.
 */
DSLExpression Round(DSLExpression x, Position pos = {});

/**
 * Returns x clamped to the range [0, 1]. If x is a vector, operates componentwise.
 */
DSLExpression Saturate(DSLExpression x, Position pos = {});

/**
 * Returns -1, 0, or 1 depending on whether x is negative, zero, or positive, respectively. If x is
 * a vector, operates componentwise.
 */
DSLExpression Sign(DSLExpression x, Position pos = {});

/**
 * Returns the sine of x. If x is a vector, operates componentwise.
 */
DSLExpression Sin(DSLExpression x, Position pos = {});

/**
 * Returns a smooth interpolation between 0 (at x=edge1) and 1 (at x=edge2). If x is a vector,
 * operates componentwise. edge1 and edge2 may either be both vectors of the same dimensions as x or
 * scalars.
 */
DSLExpression Smoothstep(DSLExpression edge1, DSLExpression edge2, DSLExpression x,
                         Position pos = {});

/**
 * Returns the square root of x. If x is a vector, operates componentwise.
 */
DSLExpression Sqrt(DSLExpression x, Position pos = {});

/**
 * Returns 0 if x < edge or 1 if x >= edge. If x is a vector, operates componentwise. edge may be
 * either a vector of the same dimensions as x, or a scalar.
 */
DSLExpression Step(DSLExpression edge, DSLExpression x, Position pos = {});

/**
 * Returns the tangent of x. If x is a vector, operates componentwise.
 */
DSLExpression Tan(DSLExpression x, Position pos = {});

/**
 * Returns x converted from premultipled to unpremultiplied alpha.
 */
DSLExpression Unpremul(DSLExpression x, Position pos = {});

} // namespace dsl

} // namespace SkSL

#endif
