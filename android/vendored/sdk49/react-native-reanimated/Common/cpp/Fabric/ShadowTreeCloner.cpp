#ifdef RCT_NEW_ARCH_ENABLED

#include "ShadowTreeCloner.h"
#include "FabricUtils.h"

namespace reanimated {

ShadowTreeCloner::ShadowTreeCloner(
    std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry,
    std::shared_ptr<UIManager> uiManager,
    SurfaceId surfaceId)
    : newestShadowNodesRegistry_{newestShadowNodesRegistry},
      propsParserContext_{
          surfaceId,
          *getContextContainerFromUIManager(&*uiManager)} {}

ShadowTreeCloner::~ShadowTreeCloner() {
#ifdef DEBUG
  react_native_assert(
      yogaChildrenUpdates_.empty() &&
      "Deallocating `ShadowTreeCloner` without calling `updateYogaChildren`.");
#endif
}

ShadowNode::Unshared ShadowTreeCloner::cloneWithNewProps(
    const ShadowNode::Shared &oldRootNode,
    const ShadowNodeFamily &family,
    RawProps &&rawProps) {
  // adapted from ShadowNode::cloneTree

  auto ancestors = family.getAncestors(*oldRootNode);

  if (ancestors.empty()) {
    return ShadowNode::Unshared{nullptr};
  }

  auto &parent = ancestors.back();
  auto &oldShadowNode = parent.first.get().getChildren().at(parent.second);

  const auto newest = newestShadowNodesRegistry_->get(oldShadowNode->getTag());

  const auto &source = newest == nullptr ? oldShadowNode : newest;

  const auto props = source->getComponentDescriptor().cloneProps(
      propsParserContext_, source->getProps(), rawProps);

  auto newChildNode = source->clone({/* .props = */ props});

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); ++it) {
    auto &parentNode = it->first.get();
    auto childIndex = it->second;

    auto children = parentNode.getChildren();
    const auto &oldChildNode = *children.at(childIndex);
    react_native_assert(ShadowNode::sameFamily(oldChildNode, *newChildNode));

    newestShadowNodesRegistry_->set(newChildNode, parentNode.getTag());

    if (!parentNode.getSealed()) {
      // Optimization: if a ShadowNode is unsealed, we can directly update its
      // children instead of cloning the whole path to the root node.
      auto &parentNodeNonConst = const_cast<ShadowNode &>(parentNode);
      parentNodeNonConst.replaceChild(oldChildNode, newChildNode, childIndex);
      yogaChildrenUpdates_.insert(&parentNodeNonConst);
      return std::const_pointer_cast<ShadowNode>(oldRootNode);
    }

    children[childIndex] = newChildNode;

    newChildNode = parentNode.clone({
        ShadowNodeFragment::propsPlaceholder(),
        std::make_shared<ShadowNode::ListOfShared>(children),
    });
  }

  return std::const_pointer_cast<ShadowNode>(newChildNode);
}

void ShadowTreeCloner::updateYogaChildren() {
  // Unfortunately, `replaceChild` does not update Yoga nodes, so we need to
  // update them manually here.
  for (ShadowNode *shadowNode : yogaChildrenUpdates_) {
    static_cast<YogaLayoutableShadowNode *>(shadowNode)->updateYogaChildren();
  }
#ifdef DEBUG
  yogaChildrenUpdates_.clear();
#endif
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
