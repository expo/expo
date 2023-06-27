#pragma once
#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/core/ShadowNode.h>
#include <memory>
#include <unordered_map>
#include <utility>

using namespace facebook::react;

namespace reanimated {

class NewestShadowNodesRegistry {
 public:
  std::lock_guard<std::mutex> createLock() const;
  // returns a lock you need to hold when calling any of the methods below

  void set(ShadowNode::Shared shadowNode, Tag parentTag);
  // updates ShadowNode and sets parent tag, to be called from Reanimated

  bool has(const ShadowNode::Shared &shadowNode) const;
  // checks if ShadowNode exists in the registry

  ShadowNode::Shared get(Tag tag) const;
  // returns the most recent version of ShadowNode or nullptr if not found

  void update(ShadowNode::Shared shadowNode);
  // updates ShadowNode that already exists in registry, to be called from RN

  void remove(Tag tag);
  // removes ShadowNode from map along with its ancestors

 private:
  std::unordered_map<Tag, std::pair<ShadowNode::Shared, Tag>> map_;
  // tag -> (most recent clone of shadow node, parent tag)
  mutable std::mutex mutex_; // Protects `map_`.
};

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
