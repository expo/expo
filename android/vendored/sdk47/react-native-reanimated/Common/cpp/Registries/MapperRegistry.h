#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <unordered_map>
#include <vector>

using namespace facebook;

namespace reanimated {

class Mapper;

class MapperRegistry {
  std::unordered_map<unsigned long, std::shared_ptr<Mapper>> mappers;
  std::vector<std::shared_ptr<Mapper>> sortedMappers;
  void updateOrder();
  bool updatedSinceLastExecute = false;

 public:
  void startMapper(std::shared_ptr<Mapper> mapper);
  void stopMapper(unsigned long id);

  void execute(jsi::Runtime &rt);

  bool needRunOnRender();
};

} // namespace reanimated
