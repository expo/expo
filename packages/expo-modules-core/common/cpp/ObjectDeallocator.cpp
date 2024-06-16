// Copyright 2022-present 650 Industries. All rights reserved.

#include "ObjectDeallocator.h"
#include "JSIUtils.h"

namespace expo::common {

void setDeallocator(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  ObjectDeallocator::Block deallocatorBlock
) {
  std::shared_ptr<ObjectDeallocator> objectDeallocator = std::make_shared<ObjectDeallocator>(
    deallocatorBlock
  );
  jsThis->setNativeState(runtime, objectDeallocator);
}

} // namespace expo::common
