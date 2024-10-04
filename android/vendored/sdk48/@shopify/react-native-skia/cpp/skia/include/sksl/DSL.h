/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_DSL
#define SKSL_DSL

#include "include/sksl/DSLBlock.h"
#include "include/sksl/DSLCore.h"
#include "include/sksl/DSLExpression.h"
#include "include/sksl/DSLFunction.h"
#include "include/sksl/DSLType.h"

namespace SkSL {

namespace dsl {

using Block = DSLBlock;
using Case = DSLCase;
using Expression = DSLExpression;
using Field = DSLField;
using Function = DSLFunction;
using GlobalVar = DSLGlobalVar;
using Layout = DSLLayout;
using Modifiers = DSLModifiers;
using Parameter = DSLParameter;
using Statement = DSLStatement;
using Var = DSLVar;

} // namespace dsl

} // namespace SkSL

#endif
