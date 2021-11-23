#pragma once

#include "DevMenuShareableValue.h"
#include "DevMenuNativeReanimatedModule.h"
#include <stdio.h>
#include <jsi/jsi.h>

using namespace facebook;

namespace devmenureanimated {

class MapperRegistry;

class Mapper : public std::enable_shared_from_this<Mapper> {
  friend MapperRegistry;
private:
  unsigned long id;
  NativeReanimatedModule *module;
  std::shared_ptr<jsi::Function> mapper;
  std::vector<std::shared_ptr<MutableValue>> inputs;
  std::vector<std::shared_ptr<MutableValue>> outputs;
  bool dirty = true;

public:
  Mapper(NativeReanimatedModule *module,
         unsigned long id,
         std::shared_ptr<jsi::Function> mapper,
         std::vector<std::shared_ptr<MutableValue>> inputs,
         std::vector<std::shared_ptr<MutableValue>> outputs);
  void execute(jsi::Runtime &rt);
  virtual ~Mapper();
};

}
