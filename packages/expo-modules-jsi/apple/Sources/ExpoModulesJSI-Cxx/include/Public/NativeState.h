#pragma once

#include <memory>
#include <jsi/jsi.h>

// `SWIFT_RETURNS_INDEPENDENT_VALUE` tells Swift/C++ interop that `getContext()`
// hands back a value that doesn't borrow from the receiver — required so the
// method is importable on the now-move-only `expo::NativeState`. The bridging
// header lives in the Xcode toolchain include path and the macro expands to
// empty when interop isn't enabled, so non-interop C++ consumers can include
// this header normally.
#if __has_include(<swift/bridging>)
#include <swift/bridging>
#else
#define SWIFT_RETURNS_INDEPENDENT_VALUE
#endif

namespace expo {

/**
 Base class for `jsi::NativeState` instances that need to round-trip through
 a Swift wrapper. Holds an opaque context pointer and a destructor callback
 that runs when the underlying shared_ptr is released. The context pointer is
 opaque to C++ — only the producer of the instance interprets it.
 */
class NativeState : public facebook::jsi::NativeState {
public:
  using Context = void *;
  using ContextDeallocator = void (*)(Context);

  explicit NativeState(Context context = nullptr, ContextDeallocator contextDeallocator = nullptr)
    : _context(context), _contextDeallocator(contextDeallocator) {}

  // Move-only ownership: each instance's `_contextDeallocator(_context)` runs
  // exactly once. The move ctor / assignment null the source's deallocator so
  // the moved-from instance's destructor is a no-op. The user-declared move
  // implicitly deletes the copy ctor and copy assignment, so copying is rejected
  // at compile time (matching the contract) without ever spelling `= delete` —
  // which would otherwise make Swift/C++ interop drop the imported type symbol.
  NativeState(NativeState &&other) noexcept
    : _context(other._context), _contextDeallocator(other._contextDeallocator) {
    other._contextDeallocator = nullptr;
  }
  NativeState &operator=(NativeState &&other) noexcept {
    if (this != &other) {
      if (_contextDeallocator) {
        _contextDeallocator(_context);
      }
      _context = other._context;
      _contextDeallocator = other._contextDeallocator;
      other._contextDeallocator = nullptr;
    }
    return *this;
  }

  ~NativeState() override {
    if (_contextDeallocator) {
      _contextDeallocator(_context);
    }
  }

  /**
   Returns the opaque context the producer baked into this instance. Only the
   producer's consumers may interpret it; today every producer encodes a
   retained Swift `JavaScriptNativeState`. If a future producer needs a
   different encoding, switch to a tagged layout first so consumers can detect
   mismatches instead of crashing.
   */
  SWIFT_RETURNS_INDEPENDENT_VALUE
  inline Context getContext() const {
    return _context;
  }

private:
  Context _context;
  ContextDeallocator _contextDeallocator;
};

/**
 Concrete `shared_ptr<jsi::NativeState>` specialization, exposed at namespace
 scope so Swift/C++ interop can import it as `expo.NativeStateShared` —
 interop does not support class templates directly, but a fully-specialized
 typedef is fine.
 */
using NativeStateShared = std::shared_ptr<facebook::jsi::NativeState>;

/**
 Concrete `weak_ptr<jsi::NativeState>` specialization. Same rationale as
 `NativeStateShared`. Lets Swift hold a non-owning reference to a pointee
 whose lifetime is otherwise managed by JSI's slot(s).
 */
using NativeStateWeak = std::weak_ptr<facebook::jsi::NativeState>;

} // namespace expo
