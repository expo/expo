#pragma once

#include <jsi/jsi.h>
#include <stdio.h>
#include <memory>
#include <unordered_map>

namespace reanimated {

using namespace facebook;

class FrozenObject;

class WorkletsCache {
 private:
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;

 public:
  std::shared_ptr<jsi::Function> getFunction(
      jsi::Runtime &rt,
      std::shared_ptr<reanimated::FrozenObject> frozenObj);
};

} // namespace reanimated
