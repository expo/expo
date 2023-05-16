#ifdef RCT_NEW_ARCH_ENABLED

#include "NewestShadowNodesRegistry.h"

#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNodeFragment.h>

using namespace facebook::react;

namespace reanimated {

void NewestShadowNodesRegistry::set(
    ShadowNode::Shared shadowNode,
    Tag parentTag) {
  map_[shadowNode->getTag()] = std::make_pair(shadowNode, parentTag);
}

bool NewestShadowNodesRegistry::has(
    const ShadowNode::Shared &shadowNode) const {
  return map_.find(shadowNode->getTag()) != map_.cend();
}

ShadowNode::Shared NewestShadowNodesRegistry::get(Tag tag) const {
  const auto it = map_.find(tag);
  return it != map_.cend() ? it->second.first : nullptr;
}

void NewestShadowNodesRegistry::update(ShadowNode::Shared shadowNode) {
  const auto it = map_.find(shadowNode->getTag());
  react_native_assert(it != map_.cend());
  it->second.first = shadowNode;
}

void NewestShadowNodesRegistry::remove(Tag tag) {
  if (map_.find(tag) == map_.cend()) {
    return;
  }

  auto shadowNode = map_[tag].first;

  while (shadowNode != nullptr) {
    bool hasAnyChildInMap = false;
    for (const auto &child : shadowNode->getChildren()) {
      if (has(child)) {
        hasAnyChildInMap = true;
        break;
      }
    }

    if (hasAnyChildInMap) {
      break;
    }

    auto it = map_.find(shadowNode->getTag());
    Tag parentTag = it->second.second;
    map_.erase(it);

    shadowNode = map_[parentTag].first;
  }
}

std::lock_guard<std::mutex> NewestShadowNodesRegistry::createLock() const {
  return std::lock_guard<std::mutex>(mutex_);
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
