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
  using Closure = facebook::jsi::Value(Context context, const facebook::jsi::Value *_Nonnull thisValue, const facebook::jsi::Value *_Nonnull args, size_t count);

  explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator), _closure(closure) {};

  virtual ~HostFunctionClosure() {
    _deallocator(_context);
  }

  /**
   Calls the Swift closure with given `this` value and arguments.
   */
  inline facebook::jsi::Value call(const facebook::jsi::Value &thisValue, const facebook::jsi::Value *_Nonnull args, size_t count) const {
    return _closure(_context, &thisValue, args, count);
  }

private:
  Closure *_Nonnull _closure;

} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure

} // namespace expo
