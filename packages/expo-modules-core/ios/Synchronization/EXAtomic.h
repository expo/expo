// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#include <stdbool.h>
#include <stdint.h>

// The atomic operations of the `Atomic` backport in Swift. Swift can't import C11 `_Atomic` types or the generic
// macros of `<stdatomic.h>`, so these functions use Clang's `__atomic` builtins on plain integers. They are
// `static inline`, so Swift compiles them into the caller. They must be in the public module, because other modules
// compile the inlinable code of `Atomic` that calls them. `swift_private` gives them a `__` prefix in Swift, which
// keeps them out of code completion. An ordering is one of Clang's `__ATOMIC_*` values. The compare-exchange returns
// the original value, which equals the expected value when it stored the desired value.

#define EX_ATOMIC_SWIFT_PRIVATE __attribute__((swift_private))

#pragma clang assume_nonnull begin

#define EX_ATOMIC_OPERATIONS(Name, Type) \
  static inline EX_ATOMIC_SWIFT_PRIVATE Type EXAtomicLoad##Name(Type *pointer, int ordering) { \
    return __atomic_load_n(pointer, ordering); \
  } \
  static inline EX_ATOMIC_SWIFT_PRIVATE void EXAtomicStore##Name(Type *pointer, Type value, int ordering) { \
    __atomic_store_n(pointer, value, ordering); \
  } \
  static inline EX_ATOMIC_SWIFT_PRIVATE Type EXAtomicExchange##Name(Type *pointer, Type value, int ordering) { \
    return __atomic_exchange_n(pointer, value, ordering); \
  } \
  static inline EX_ATOMIC_SWIFT_PRIVATE Type EXAtomicCompareExchange##Name( \
    Type *pointer, Type expected, Type desired, int successOrdering, int failureOrdering \
  ) { \
    __atomic_compare_exchange_n(pointer, &expected, desired, false, successOrdering, failureOrdering); \
    return expected; \
  } \
  static inline EX_ATOMIC_SWIFT_PRIVATE Type EXAtomicFetchAdd##Name(Type *pointer, Type value, int ordering) { \
    return __atomic_fetch_add(pointer, value, ordering); \
  } \
  static inline EX_ATOMIC_SWIFT_PRIVATE Type EXAtomicFetchSubtract##Name(Type *pointer, Type value, int ordering) { \
    return __atomic_fetch_sub(pointer, value, ordering); \
  }

EX_ATOMIC_OPERATIONS(UInt8, uint8_t)
EX_ATOMIC_OPERATIONS(UInt16, uint16_t)
EX_ATOMIC_OPERATIONS(UInt32, uint32_t)
EX_ATOMIC_OPERATIONS(UInt64, uint64_t)

#undef EX_ATOMIC_OPERATIONS
#undef EX_ATOMIC_SWIFT_PRIVATE

#pragma clang assume_nonnull end
