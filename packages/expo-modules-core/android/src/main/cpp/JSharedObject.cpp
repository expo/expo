// Copyright 2021-present 650 Industries. All rights reserved.

#include "JSharedObject.h"

namespace expo {

int JSharedObject::getId() noexcept {
  static const auto method = javaClassStatic()->getMethod<int()>("getSharedObjectId");
  return method(self());
}

} // namespace expo
