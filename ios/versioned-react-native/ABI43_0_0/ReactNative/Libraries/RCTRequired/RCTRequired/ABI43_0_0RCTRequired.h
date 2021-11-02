/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <utility>

// The inliner doesn't take into account ARC optimizations that may occur after
// inlining when computing the inline cost of an ObjC++ function. Here we make
// the inlining decisions to avoid unnecessary code bloat. In effect ABI43_0_0RCTRequired
// is a cost-free abstraction in non-DEBUG mode. In DEBUG mode we don't force
// inlining for ease of debugging.
#if DEBUG
#define ABI43_0_0RCTREQUIRED_INLINE inline
#else
#define ABI43_0_0RCTREQUIRED_INLINE __attribute__((always_inline)) inline
#endif

/**
 ABI43_0_0RCTRequired<T> uses the compiler to enforce definition of a struct member (primitives, pointers, or objects).

 Internally, we use an implicit constructor without a default, so there has to be an initial value.

 Usage:
 @code
 struct S {
 ABI43_0_0RCTRequired<int> i;
 ABI43_0_0RCTRequired<NSString *> str;
 NSString *optionalStr;
 };

 S options = {
 .i = 0,                // warning if omitted
 .str = @"Hello World", // warning if omitted
 };
 @endcode
 */
template <typename T>
struct ABI43_0_0RCTRequired {
  /// Pass-through constructor (allows for implicit conversion) for wrapped type T
  template<typename... Args>
  ABI43_0_0RCTREQUIRED_INLINE
  ABI43_0_0RCTRequired(Args&&... args): _t(std::forward<Args>(args)...) {
    static_assert(sizeof...(Args) > 0, "Required struct member not initialized. Expand assert trace to see where this was triggered.");
  }

  ABI43_0_0RCTREQUIRED_INLINE
  ABI43_0_0RCTRequired(const ABI43_0_0RCTRequired&) = default;
  ABI43_0_0RCTREQUIRED_INLINE
  ABI43_0_0RCTRequired(ABI43_0_0RCTRequired&&) = default;

  ABI43_0_0RCTREQUIRED_INLINE
  ABI43_0_0RCTRequired& operator=(const ABI43_0_0RCTRequired&) = default;
  ABI43_0_0RCTREQUIRED_INLINE
  ABI43_0_0RCTRequired& operator=(ABI43_0_0RCTRequired&&) = default;

  ABI43_0_0RCTREQUIRED_INLINE
  ~ABI43_0_0RCTRequired() = default;

  /// Public accessor for private storage (Use when implicit conversion is impracticable)
  ABI43_0_0RCTREQUIRED_INLINE
  const T &get() const { return _t; }
  ABI43_0_0RCTREQUIRED_INLINE
  T &get() { return _t; }


  // Implicit conversion
  ABI43_0_0RCTREQUIRED_INLINE
  operator T() const { return _t; }
  ABI43_0_0RCTREQUIRED_INLINE
  operator T&() { return _t; }

private:
  T _t;
};
