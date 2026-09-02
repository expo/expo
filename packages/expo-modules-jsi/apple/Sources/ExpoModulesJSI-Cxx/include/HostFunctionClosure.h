#pragma once

#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

/**
 Holds a pointer to a closure in Swift that provides host function's implementation.
 */
class HostFunctionClosure final : public RetainedSwiftPointer {
public:
  // The result travels through an out-parameter instead of a return value: the Swift side can then
  // write it straight into the caller's slot from inside its guaranteed-reference scope, with no
  // placeholder value to construct and no extra move of the `jsi::Value`.
  using Closure = void(Context context, const facebook::jsi::Value *_Nonnull thisValue, const facebook::jsi::Value *_Nonnull args, size_t count, facebook::jsi::Value *_Nonnull result);

  explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator), _closure(closure) {};

  virtual ~HostFunctionClosure() {
    _deallocator(_context);
  }

  /**
   Calls the Swift closure with given `this` value and arguments.
   */
  inline void call(const facebook::jsi::Value &thisValue, const facebook::jsi::Value *_Nonnull args, size_t count, facebook::jsi::Value &result) const {
    _closure(_context, &thisValue, args, count, &result);
  }

private:
  Closure *_Nonnull _closure;

} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure

} // namespace expo
