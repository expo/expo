// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <concepts>
#include <fbjni/fbjni.h>
#include "jni_deref.h"

namespace jni = facebook::jni;

namespace expo {

template<typename T>
concept HasCthis = requires(T &t) { t->cthis(); };

template<typename T>
concept HasToStdString = requires(T &t) { t->toStdString(); };

template<typename T>
concept HasValue = requires(T &t) { t->value(); };

template<typename T>
concept HasGetRegion = requires(T &t, jsize s) { t->getRegion(s, s); };

template<typename T>
concept IsJBoolean = std::is_same_v<jni_deref_t<T>, jni::JBoolean>;

template<typename T>
concept JniRef =
  std::is_same_v<T, jni::local_ref<jni_deref_t<T>>> ||
  std::is_same_v<T, jni::global_ref<jni_deref_t<T>>> ||
  std::is_same_v<T, jni::alias_ref<jni_deref_t<T>>>;

template<typename T, typename Inner>
concept JniRefTo = JniRef<T> && std::is_same_v<jni_deref_t<T>, Inner>;

template<typename T, typename Inner>
concept JCollectionRef = JniRefTo<T, jni::JCollection<Inner>>;

template<typename T, typename Key, typename Value>
concept JMapRef = JniRefTo<T, jni::JMap<Key, Value>>;

} // namespace expo
