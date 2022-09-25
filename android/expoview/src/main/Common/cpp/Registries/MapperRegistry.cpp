#include "MapperRegistry.h"
#include <array>
#include <map>
#include <set>
#include "Mapper.h"

namespace reanimated {

void MapperRegistry::startMapper(std::shared_ptr<Mapper> mapper) {
  mappers[mapper->id] = mapper;
  updatedSinceLastExecute = true;
}

void MapperRegistry::stopMapper(unsigned long id) {
  mappers.erase(id);
  updatedSinceLastExecute = true;
}

void MapperRegistry::execute(jsi::Runtime &rt) {
  if (updatedSinceLastExecute) {
    updateOrder();
    updatedSinceLastExecute = false;
  }
  for (auto &mapper : sortedMappers) {
    if (mapper->dirty) {
      mapper->execute(rt);
    }
  }
}

bool MapperRegistry::needRunOnRender() {
  return updatedSinceLastExecute; // TODO: also run if input nodes are dirty
}

void MapperRegistry::updateOrder() { // Topological sorting
  sortedMappers.clear();

  struct NodeID {
    std::shared_ptr<Mapper> mapper;
    std::shared_ptr<MutableValue> mutableValue;

    explicit NodeID(std::shared_ptr<Mapper> mapper) {
      if (mapper == nullptr) {
        throw std::runtime_error(
            "Graph couldn't be sorted (Mapper cannot be nullptr)");
      }
      this->mapper = mapper;
    }

    explicit NodeID(std::shared_ptr<MutableValue> mutableValue) {
      if (mutableValue == nullptr) {
        throw std::runtime_error(
            "Graph couldn't be sorted (Mutable cannot be nullptr)");
      }
      this->mutableValue = mutableValue;
    }

    bool isMutable() const {
      return mutableValue != nullptr;
    }

    bool operator<(const NodeID &other) const {
      if (isMutable() != other.isMutable())
        return isMutable() < other.isMutable();

      if (isMutable()) {
        return mutableValue < other.mutableValue;
      }

      return mapper < other.mapper;
    }
  };

  std::map<NodeID, int> deg;

  std::map<std::shared_ptr<MutableValue>, std::vector<std::shared_ptr<Mapper>>>
      mappersThatUseSharedValue;

  std::set<std::pair<int, NodeID>> nodes;

  std::function<void(NodeID)> update = [&](NodeID id) {
    auto entry = std::make_pair(deg[id], id);
    if (nodes.find(entry) == nodes.end())
      return;
    nodes.erase(entry);
    entry.first--;
    deg[id]--;
    nodes.insert(entry);
  };

  for (auto &entry : mappers) {
    auto id = NodeID(entry.second);
    auto &mapper = entry.second;
    deg[id] = mapper->inputs.size();
    nodes.insert(std::make_pair(deg[id], id));

    for (auto sharedValue : mapper->inputs) {
      auto sharedValueID = NodeID(sharedValue);
      mappersThatUseSharedValue[sharedValue].push_back(mapper);
      if (deg.count(sharedValueID) == 0) {
        deg[sharedValueID] = 0;
      }
    }

    for (auto sharedValue : mapper->outputs) {
      deg[NodeID(sharedValue)]++;
    }
  }

  for (auto &entry : deg) {
    auto id = entry.first;
    if (id.isMutable()) {
      nodes.insert(std::make_pair(entry.second, id));
    }
  }

  while (nodes.size() > 0 && nodes.begin()->first == 0) {
    auto entry = *nodes.begin();
    nodes.erase(entry);

    auto id = entry.second;
    std::vector<NodeID> toUpdate;

    if (id.isMutable()) {
      for (auto id : mappersThatUseSharedValue[id.mutableValue]) {
        toUpdate.push_back(NodeID(id));
      }
    } else {
      for (auto sharedValue : id.mapper->outputs) {
        toUpdate.push_back(NodeID(sharedValue));
      }

      sortedMappers.push_back(id.mapper);
    }

    for (auto &id : toUpdate)
      update(id);
  }

  if (nodes.size() > 0) {
    throw std::runtime_error("Cycle in mappers graph!");
  }
}

} // namespace reanimated
