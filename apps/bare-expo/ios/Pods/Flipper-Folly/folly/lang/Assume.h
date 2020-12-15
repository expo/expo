/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/Portability.h>

namespace folly {

/**
 * assume*() functions can be used to fine-tune optimizations or suppress
 * warnings when certain conditions are provably true, but the compiler is not
 * able to prove them.
 *
 * This is different from assertions: an assertion will place an explicit check
 * that the condition is true, and abort the program if the condition is not
 * verified. Calling assume*() with a condition that is not true at runtime
 * is undefined behavior: for example, it may or may not result in a crash,
 * silently corrupt memory, or jump to a random code path.
 *
 * These functions should only be used on conditions that are provable internal
 * logic invariants; they cannot be used safely if the condition depends on
 * external inputs or data. To detect unexpected conditions that *can* happen,
 * an assertion or exception should be used.
 */

/**
 * assume(cond) informs the compiler that cond can be assumed true. If cond is
 * not true at runtime the behavior is undefined.
 *
 * The typical use case is to allow the compiler exploit data structure
 * invariants that can trigger better optimizations, for example to eliminate
 * unnecessary bounds checks in a called function. It is recommended to check
 * the generated code or run microbenchmarks to assess whether it is actually
 * effective.
 *
 * The semantics are similar to clang's __builtin_assume(), but intentionally
 * implemented as a function to force the evaluation of its argument, contrary
 * to the builtin, which cannot used with expressions that have side-effects.
 */
FOLLY_ALWAYS_INLINE void assume(bool cond);

/**
 * assume_unreachable() informs the compiler that the statement is not reachable
 * at runtime. It is undefined behavior if the statement is actually reached.
 *
 * Common use cases are to suppress a warning when the compiler cannot prove
 * that the end of a non-void function is not reachable, or to optimize the
 * evaluation of switch/case statements when all the possible values are
 * provably enumerated.
 */
[[noreturn]] FOLLY_ALWAYS_INLINE void assume_unreachable();

} // namespace folly

#include <folly/lang/Assume-inl.h>
