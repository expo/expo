#pragma once

#include <vector>
#include <unordered_map>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

using namespace ABI43_0_0facebook;

namespace ABI43_0_0reanimated {

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

}
