// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __APPLE__
  #include <ExpoModulesJSI/ObjectDeallocator.h>
  #include <ExpoModulesJSI/JSIUtils.h>
#else
  #include "ObjectDeallocator.h"
  #include "JSIUtils.h"
#endif

namespace expo::common {

void setDeallocator(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  ObjectDeallocator::Block deallocatorBlock
) {
  std::shared_ptr<ObjectDeallocator> objectDeallocator = std::make_shared<ObjectDeallocator>(
    std::move(deallocatorBlock)
  );
  jsThis->setNativeState(runtime, objectDeallocator);
}

} // namespace expo::common
