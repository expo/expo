// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>

#include <folly/dynamic.h>

#include "ABI15_0_0ExecutorToken.h"

namespace facebook {
namespace ReactABI15_0_0 {

struct MethodDescriptor {
  std::string name;
  // type is one of js MessageQueue.MethodTypes
  std::string type;

  MethodDescriptor(std::string n, std::string t)
      : name(std::move(n))
      , type(std::move(t)) {}
};

class NativeModule {
 public:
  virtual ~NativeModule() {}
  virtual std::string getName() = 0;
  virtual std::vector<MethodDescriptor> getMethods() = 0;
  virtual folly::dynamic getConstants() = 0;
  virtual bool supportsWebWorkers() = 0;
  // TODO mhorowitz: do we need initialize()/onCatalystInstanceDestroy() in C++
  // or only Java?
  virtual void invoke(ExecutorToken token, unsigned int ReactABI15_0_0MethodId, folly::dynamic&& params) = 0;
  virtual MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int ReactABI15_0_0MethodId, folly::dynamic&& args) = 0;
};

}
}
