// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo::common {

static constexpr char kDefaultDeallocatorPropName[] = "__expo_object_deallocator__";

class JSI_EXPORT ObjectDeallocator : public jsi::HostObject {
public:
  typedef std::function<void()> Block;

  ObjectDeallocator(const Block deallocator) : deallocator(deallocator) {};

  virtual ~ObjectDeallocator() {
    deallocator();
  }

  const Block deallocator;

}; // class ObjectDeallocator

/**
 Sets the deallocator block on a given object, which is called when the object is being deallocated.
 */
void setDeallocator(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  ObjectDeallocator::Block deallocatorBlock,
  const std::string &key = kDefaultDeallocatorPropName
);

/**
 Trigger deallocator on a given object.
 Exposing this function only for unit tests. In normal case, the deallocator should be triggered from garbage collection in JavaScript engines.
 */
void triggerDeallocatorForTesting(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  const std::string &key = kDefaultDeallocatorPropName
);

} // namespace expo::common

#endif
