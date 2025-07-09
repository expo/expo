// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIDeallocator.h"

namespace expo {

void JNIDeallocator::addReference(
  jni::local_ref<Destructible::javaobject> jniObject
) noexcept {
  const static auto method = JNIDeallocator::javaClassLocal()
    ->getMethod<void(jni::local_ref<Destructible>)>(
      "addReference"
    );
  method(self(), std::move(jniObject));
}

} // namespace expo
