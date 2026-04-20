// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <concepts>
#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo::jni_deref_impl {

template<typename T>
struct deref {
  using type = T;
};

template<typename T>
struct deref<jni::local_ref<T>> {
  using type = T;
};

template<typename T>
struct deref<jni::global_ref<T>> {
  using type = T;
};

template<typename T>
struct deref<jni::alias_ref<T>> {
  using type = T;
};

} // namespace expo::jni_deref_impl

namespace expo {

template<typename T>
using jni_deref_t = typename jni_deref_impl::deref<std::remove_cvref_t<T>>::type;

} // namespace expo
