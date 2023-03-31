// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

class JSI_EXPORT ObjectDeallocator : public jsi::HostObject {
public:
  typedef std::function<void()> ObjectDeallocatorType;

  ObjectDeallocator(ObjectDeallocatorType deallocator) : deallocator(deallocator) {};

  virtual ~ObjectDeallocator() {
    deallocator();
  }

  const ObjectDeallocatorType deallocator;

}; // class ObjectDeallocator

}
