#pragma once

#include <memory>
#include <swift/bridging>

namespace expo {

/**
 Holds a type-erased pointer to a Swift instance that is now owned by this C++ instance.
 Derived classes must call the deallocator function once the pointer is no longer necessary and can be released by Swift.
 */
class RetainedSwiftPointer {
public:
  using Context = void *_Nonnull;
  using Deallocator = void(Context);

  explicit RetainedSwiftPointer(Context context, Deallocator deallocator) : _context(context), _deallocator(std::move(deallocator)) {}

  virtual ~RetainedSwiftPointer() = default;

protected:
  Context _context;
  Deallocator *_Nonnull _deallocator;

} SWIFT_IMMORTAL_REFERENCE; // class RetainedSwiftPointer

} // namespace expo
