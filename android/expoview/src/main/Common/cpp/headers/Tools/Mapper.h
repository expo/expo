#pragma once

#include <stdio.h>
#include <jsi/jsi.h>
#include "ShareableValue.h"
#include "NativeReanimatedModule.h"

namespace reanimated {

using namespace facebook;

class MapperRegistry;

class Mapper {
  friend MapperRegistry;
private:
  unsigned long id;
  NativeReanimatedModule *module;
  jsi::Function mapper;
  std::vector<std::shared_ptr<MutableValue>> inputs;
  std::vector<std::shared_ptr<MutableValue>> outputs;
  bool dirty = true;

public:
  Mapper(NativeReanimatedModule *module,
         unsigned long id,
         jsi::Function &&mapper,
         std::vector<std::shared_ptr<MutableValue>> inputs,
         std::vector<std::shared_ptr<MutableValue>> outputs);
  void execute(jsi::Runtime &rt);
};

}
