#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/core/ComponentDescriptor.h>

#include "ReanimatedCommitHook.h"
#include "ReanimatedCommitMarker.h"
#include "ShadowTreeCloner.h"

using namespace facebook::react;

namespace reanimated {

ReanimatedCommitHook::ReanimatedCommitHook(
    const std::shared_ptr<PropsRegistry> &propsRegistry,
    const std::shared_ptr<UIManager> &uiManager)
    : propsRegistry_(propsRegistry), uiManager_(uiManager) {
  uiManager_->registerCommitHook(*this);
}

ReanimatedCommitHook::~ReanimatedCommitHook() noexcept {
  uiManager_->unregisterCommitHook(*this);
}

RootShadowNode::Unshared ReanimatedCommitHook::shadowTreeWillCommit(
    ShadowTree const &,
    RootShadowNode::Shared const &,
#if REACT_NATIVE_MINOR_VERSION >= 73
    RootShadowNode::Unshared const &newRootShadowNode) noexcept {
#else
    RootShadowNode::Unshared const &newRootShadowNode) const noexcept {
#endif
  if (ReanimatedCommitMarker::isReanimatedCommit()) {
    // ShadowTree commited by Reanimated, no need to apply updates from
    // PropsRegistry
    return newRootShadowNode;
  }

  // ShadowTree not commited by Reanimated, apply updates from PropsRegistry

  auto rootNode = newRootShadowNode->ShadowNode::clone(ShadowNodeFragment{});

  {
    auto lock = propsRegistry_->createLock();

    propsRegistry_->for_each(
        [&](const ShadowNodeFamily &family, const folly::dynamic &props) {
          auto newRootNode =
              cloneShadowTreeWithNewProps(rootNode, family, RawProps(props));

          if (newRootNode == nullptr) {
            // this happens when React removed the component but Reanimated
            // still tries to animate it, let's skip update for this specific
            // component
            return;
          }
          rootNode = newRootNode;
        });
  }

  // If the commit comes from React Native then skip one commit from Reanimated
  // since the ShadowTree to be committed by Reanimated may not include the new
  // changes from React Native yet and all changes of animated props will be
  // applied in ReanimatedCommitHook by iterating over PropsRegistry.
  propsRegistry_->pleaseSkipReanimatedCommit();

  return std::static_pointer_cast<RootShadowNode>(rootNode);
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
