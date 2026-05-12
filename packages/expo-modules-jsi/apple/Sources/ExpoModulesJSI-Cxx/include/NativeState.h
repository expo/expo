#pragma once

#include <memory>
#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

/**
 Custom JSI native state that holds a pointer to `JavaScriptNativeState` in Swift.
 */
class NativeState final : public RetainedSwiftPointer, public facebook::jsi::NativeState {
public:
  explicit NativeState(Context context, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator) {}

  virtual ~NativeState() {
    _deallocator(_context);
  }

  inline Context getContext() {
    return _context;
  }

} SWIFT_IMMORTAL_REFERENCE; // class NativeState

} // namespace expo
