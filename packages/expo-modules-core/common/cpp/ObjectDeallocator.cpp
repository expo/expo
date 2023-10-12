// Copyright 2022-present 650 Industries. All rights reserved.

#include "ObjectDeallocator.h"
#include "JSIUtils.h"

namespace expo::common {

void setDeallocator(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  ObjectDeallocator::Block deallocatorBlock,
  const std::string &key
) {
  std::shared_ptr<ObjectDeallocator> hostObjectPtr = std::make_shared<ObjectDeallocator>(
    deallocatorBlock
  );
  jsi::Object jsDeallocator = jsi::Object::createFromHostObject(runtime, hostObjectPtr);
  jsThis->setProperty(runtime, key.c_str(), jsi::Value(runtime, jsDeallocator));
}

void triggerDeallocatorForTesting(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  const std::string &key
) {
  auto jsDeallocator = jsThis->getProperty(runtime, key.c_str())
    .asObject(runtime)
    .asHostObject<ObjectDeallocator>(runtime);
  jsDeallocator->deallocator();
}

} // namespace expo::common
