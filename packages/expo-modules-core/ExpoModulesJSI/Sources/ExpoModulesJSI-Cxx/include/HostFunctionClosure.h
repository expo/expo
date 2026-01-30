#pragma once

#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

class HostFunctionClosure final : public RetainedSwiftPointer {
public:
  using Context = void *_Nonnull;
  using Closure = facebook::jsi::Value(Context context, const facebook::jsi::Value *_Nonnull thisValue, const facebook::jsi::Value *_Nonnull args, size_t count);
  using Deallocator = void(Context);

  explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator), _closure(closure) {};

  ~HostFunctionClosure() {
    _deallocator(_context);
  }

  inline facebook::jsi::Value call(const facebook::jsi::Value &thisValue, const facebook::jsi::Value *_Nonnull args, size_t count) const {
    return _closure(_context, &thisValue, args, count);
  }

private:
  Closure *_Nonnull _closure;

} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure

} // namespace expo
