/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/Function.h>
#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/functional/Invoke.h>
#include <folly/lang/Launder.h>

namespace folly {
namespace detail {

/**
 * InlineFunctionRef is similar to folly::FunctionRef but has the additional
 * benefit of being able to store the function it was instantiated with inline
 * in a buffer of the given capacity.  Inline storage is only used if the
 * function object and a pointer (for type-erasure) are small enough to fit in
 * the templated size.  If there is not enough in-situ capacity for the
 * callable, this just stores a reference to the function object like
 * FunctionRef.
 *
 * This helps give a perf boost in the case where the data gets separated from
 * the point of invocation.  If, for example, at the point of invocation, the
 * InlineFunctionRef object is not cached, a remote memory/cache read might be
 * required to invoke the original callable.  Customizable inline storage
 * helps tune storage so we can store a type-erased callable with better
 * performance and locality.  A real-life example of this might be a
 * folly::FunctionRef with a function pointer.  The folly::FunctionRef would
 * point to the function pointer object in a remote location.  This causes a
 * double-indirection at the point of invocation, and if that memory is dirty,
 * or not cached, it would cause additional cache misses.  On the other hand
 * with InlineFunctionRef, inline storage would store the value of the
 * function pointer, avoiding the need to do a remote lookup to fetch the
 * value of the function pointer.
 *
 * To prevent misuse, InlineFunctionRef disallows construction from an lvalue
 * callable.  This is to prevent usage where a user relies on the callable's
 * state after invocation through InlineFunctionRef.  This has the potential
 * to copy the callable into inline storage when the callable is small, so we
 * might not use the same function when invoking, but rather a copy of it.
 *
 * Also note that InlineFunctionRef will always invoke the const qualified
 * version of the call operator for any callable that is passed.  Regardless
 * of whether it has a non-const version.  This is done to enforce the logical
 * constraint of function state being immutable.
 *
 * This class is always trivially-copyable (and therefore
 * trivially-destructible), making it suitable for use in a union without
 * requiring manual destruction.
 */
template <typename FunctionType, std::size_t Size>
class InlineFunctionRef;

template <typename ReturnType, typename... Args, std::size_t Size>
class InlineFunctionRef<ReturnType(Args...), Size> {
  template <typename Arg>
  using CallArg = function::CallArg<Arg>;

  using Storage =
      std::aligned_storage_t<Size - sizeof(uintptr_t), sizeof(uintptr_t)>;
  using Call = ReturnType (*)(CallArg<Args>..., const Storage&);

  struct InSituTag {};
  struct RefTag {};

  static_assert(
      (Size % sizeof(uintptr_t)) == 0,
      "Size has to be a multiple of sizeof(uintptr_t)");
  static_assert(Size >= 2 * sizeof(uintptr_t), "This doesn't work");
  static_assert(alignof(Call) == alignof(Storage), "Mismatching alignments");

  // This defines a mode tag that is used in the construction of
  // InlineFunctionRef to determine the storage and indirection method for the
  // passed callable.
  //
  // This requires that the we pass in a type that is not ref-qualified.
  template <typename Func>
  using ConstructMode = std::conditional_t<
      folly::is_trivially_copyable<Func>{} &&
          (sizeof(Func) <= sizeof(Storage)) &&
          (alignof(Func) <= alignof(Storage)),
      InSituTag,
      RefTag>;

 public:
  /**
   * InlineFunctionRef can be constructed from a nullptr, callable or another
   * InlineFunctionRef with the same size.  These are the constructors that
   * don't take a callable.
   *
   * InlineFunctionRef is meant to be trivially copyable so we default the
   * constructors and assignment operators.
   */
  InlineFunctionRef(std::nullptr_t) : call_{nullptr} {}
  InlineFunctionRef() : call_{nullptr} {}
  InlineFunctionRef(const InlineFunctionRef& other) = default;
  InlineFunctionRef(InlineFunctionRef&&) = default;
  InlineFunctionRef& operator=(const InlineFunctionRef&) = default;
  InlineFunctionRef& operator=(InlineFunctionRef&&) = default;

  /**
   * Constructors from callables.
   *
   * If all of the following conditions are satisfied, then we store the
   * callable in the inline storage:
   *
   *  1) The function has been passed as an rvalue, meaning that there is no
   *     use of the original in the user's code after it has been passed to
   *     us.
   *  2) Size of the callable is less than the size of the inline storage
   *     buffer.
   *  3) The callable is trivially constructible and destructible.
   *
   * If any one of the above conditions is not satisfied, we fall back to
   * reference semantics and store the function as a pointer, and add a level
   * of indirection through type erasure.
   */
  template <
      typename Func,
      std::enable_if_t<
          !std::is_same<std::decay_t<Func>, InlineFunctionRef>{} &&
          !std::is_reference<Func>{} &&
          folly::is_invocable_r_v<ReturnType, Func&&, Args&&...>>* = nullptr>
  InlineFunctionRef(Func&& func) {
    // We disallow construction from lvalues, so assert that this is not a
    // reference type.  When invoked with an lvalue, Func is a lvalue
    // reference type, when invoked with an rvalue, Func is not ref-qualified.
    static_assert(
        !std::is_reference<Func>{},
        "InlineFunctionRef cannot be used with lvalues");
    static_assert(std::is_rvalue_reference<Func&&>{}, "");
    construct(ConstructMode<Func>{}, folly::as_const(func));
  }

  /**
   * The call operator uses the function pointer and a reference to the
   * storage to do the dispatch.  The function pointer takes care of the
   * appropriate casting.
   */
  ReturnType operator()(Args... args) const {
    return call_(static_cast<Args&&>(args)..., storage_);
  }

  /**
   * We have a function engaged if the call function points to anything other
   * than null.
   */
  operator bool() const noexcept {
    return call_;
  }

 private:
  friend class InlineFunctionRefTest;

  /**
   * Inline storage constructor implementation.
   */
  template <typename Func>
  void construct(InSituTag, Func& func) {
    using Value = std::remove_reference_t<Func>;

    // Assert that the following two assumptions are valid
    //    1) fit in the storage space we have and match alignments, and
    //    2) be invocable in a const context, it does not make sense to copy a
    //       callable into inline storage if it makes state local
    //       modifications.
    static_assert(alignof(Value) <= alignof(Storage), "");
    static_assert(is_invocable<const std::decay_t<Func>, Args&&...>{}, "");
    static_assert(folly::is_trivially_copyable<Value>{}, "");

    new (&storage_) Value{func};
    call_ = &callInline<Value>;
  }

  /**
   * Ref storage constructor implementation.  This is identical to
   * folly::FunctionRef.
   */
  template <typename Func>
  void construct(RefTag, Func& func) {
    // store a pointer to the function
    using Pointer = std::add_pointer_t<std::remove_reference_t<Func>>;
    new (&storage_) Pointer{&func};
    call_ = &callPointer<Pointer>;
  }

  template <typename Func>
  static ReturnType callInline(CallArg<Args>... args, const Storage& object) {
    // The only type of pointer allowed is a function pointer, no other
    // pointer types are invocable.
    static_assert(
        !std::is_pointer<Func>::value ||
            std::is_function<std::remove_pointer_t<Func>>::value,
        "");
    return folly::invoke(
        *folly::launder(reinterpret_cast<const Func*>(&object)),
        static_cast<Args&&>(args)...);
  }

  template <typename Func>
  static ReturnType callPointer(CallArg<Args>... args, const Storage& object) {
    // When the function we were instantiated with was not trivial, the given
    // pointer points to a pointer, which pointers to the callable.  So we
    // cast to a pointer and then to the pointee.
    static_assert(std::is_pointer<Func>::value, "");
    return folly::invoke(
        **folly::launder(reinterpret_cast<const Func*>(&object)),
        static_cast<Args&&>(args)...);
  }

  Call call_;
  Storage storage_{};
};

} // namespace detail
} // namespace folly
