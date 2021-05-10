#pragma once

#include <stdio.h>
#include <unordered_map>
#include <jsi/jsi.h>
#include <memory>

namespace reanimated
{

using namespace facebook;

class FrozenObject;

class WorkletsCache {
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;
public:
  std::shared_ptr<jsi::Function> getFunction(jsi::Runtime & rt, std::shared_ptr<reanimated::FrozenObject> frozenObj);
};

} // namespace reanimated
