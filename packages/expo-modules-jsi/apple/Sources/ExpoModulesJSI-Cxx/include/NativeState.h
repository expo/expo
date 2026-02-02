#pragma once

#include <memory>
#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

class NativeState: public RetainedSwiftPointer, public facebook::jsi::NativeState {
public:
  using Shared = std::shared_ptr<NativeState>;

  explicit NativeState(Context context, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator) {}

  ~NativeState() {
    _deallocator(_context);
  }

  inline Context getContext() {
    return _context;
  }

} SWIFT_IMMORTAL_REFERENCE; // class NativeState

} // namespace expo
