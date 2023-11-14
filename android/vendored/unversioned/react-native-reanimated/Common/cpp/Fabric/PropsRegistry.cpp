#ifdef RCT_NEW_ARCH_ENABLED

#include "PropsRegistry.h"

namespace reanimated {

std::lock_guard<std::mutex> PropsRegistry::createLock() const {
  return std::lock_guard<std::mutex>(mutex_);
}

void PropsRegistry::update(
    const ShadowNode::Shared &shadowNode,
    folly::dynamic &&props) {
  const auto tag = shadowNode->getTag();
  const auto it = map_.find(tag);
  if (it == map_.cend()) {
    // we need to store ShadowNode because `ShadowNode::getFamily`
    // returns `ShadowNodeFamily const &` which is non-owning
    map_[tag] = std::make_pair(shadowNode, props);
  } else {
    // no need to update `.first` because ShadowNode's family never changes
    // merge new props with old props
    it->second.second.update(props);
  }
}

void PropsRegistry::for_each(std::function<void(
                                 const ShadowNodeFamily &family,
                                 const folly::dynamic &props)> callback) const {
  for (const auto &[_, value] : map_) {
    callback(value.first->getFamily(), value.second);
  }
}

void PropsRegistry::remove(const Tag tag) {
  map_.erase(tag);
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
