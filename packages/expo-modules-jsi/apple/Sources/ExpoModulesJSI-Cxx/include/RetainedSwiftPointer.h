#pragma once

#include <swift/bridging>

namespace expo {

class RetainedSwiftPointer {
public:
  using Context = void *_Nonnull;
  using Deallocator = void(Context);

  explicit RetainedSwiftPointer(Context context, Deallocator deallocator) : _context(context), _deallocator(std::move(deallocator)) {}

  virtual ~RetainedSwiftPointer() = 0;

protected:
  Context _context;
  Deallocator *_Nonnull _deallocator;

} SWIFT_IMMORTAL_REFERENCE; // class RetainedSwiftPointer

} // namespace expo
