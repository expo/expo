// Copyright 2022 Google LLC
// Use of this source code is governed by a BSD-style license that can be found in the LICENSE file.

#ifndef SkTypeTraits_DEFINED
#define SkTypeTraits_DEFINED

#include <memory>
#include <type_traits>

// Trait for identifying types which are relocatable via memcpy, for container optimizations.
template<typename, typename = void>
struct sk_has_trivially_relocatable_member : std::false_type {};

// Types can declare themselves trivially relocatable with a public
//    using sk_is_trivially_relocatable = std::true_type;
template<typename T>
struct sk_has_trivially_relocatable_member<T, std::void_t<typename T::sk_is_trivially_relocatable>>
        : T::sk_is_trivially_relocatable {};

// By default, all trivially copyable types are trivially relocatable.
template <typename T>
struct sk_is_trivially_relocatable
        : std::disjunction<std::is_trivially_copyable<T>, sk_has_trivially_relocatable_member<T>>{};

// Here be some dragons: while technically not guaranteed, we count on all sane unique_ptr
// implementations to be trivially relocatable.
template <typename T>
struct sk_is_trivially_relocatable<std::unique_ptr<T>> : std::true_type {};

template <typename T>
inline constexpr bool sk_is_trivially_relocatable_v = sk_is_trivially_relocatable<T>::value;

#endif  // SkTypeTraits_DEFINED
