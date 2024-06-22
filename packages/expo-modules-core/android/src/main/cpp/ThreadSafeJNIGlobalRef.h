// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <android/log.h>

namespace jni = facebook::jni;

namespace expo {

/*
 * A wrapper for a global reference that can be deallocated on any thread.
 * It should be used with smart pointer. That structure can't be copied or moved.
 */
template<typename T>
class ThreadSafeJNIGlobalRef {
public:
  ThreadSafeJNIGlobalRef(jobject globalRef) : globalRef(globalRef) {}
  ThreadSafeJNIGlobalRef(const ThreadSafeJNIGlobalRef &other) = delete;
  ThreadSafeJNIGlobalRef(ThreadSafeJNIGlobalRef &&other) = delete;
  ThreadSafeJNIGlobalRef &operator=(const ThreadSafeJNIGlobalRef &other) = delete;
  ThreadSafeJNIGlobalRef &operator=(ThreadSafeJNIGlobalRef &&other) = delete;

  void use(std::function<void(jni::alias_ref<T> globalRef)> &&action) {
    if (globalRef == nullptr) {
      __android_log_print(ANDROID_LOG_WARN, "ExpoModulesCore", "ThreadSafeJNIGlobalRef was used after deallocation.");
      return;
    }

    jni::ThreadScope::WithClassLoader([this, action = std::move(action)]() {
      jni::alias_ref<jobject> aliasRef = jni::wrap_alias(globalRef);
      jni::alias_ref<T> jsiContextRef = jni::static_ref_cast<T>(aliasRef);
      action(jsiContextRef);
    });
  }

  ~ThreadSafeJNIGlobalRef() {
    if (globalRef != nullptr) {
      jni::ThreadScope::WithClassLoader([this] {
        jni::Environment::current()->DeleteGlobalRef(this->globalRef);
      });
    }
  }

  jobject globalRef;
};

} // namespace expo
