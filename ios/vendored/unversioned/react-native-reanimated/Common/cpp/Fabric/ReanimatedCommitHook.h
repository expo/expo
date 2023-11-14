#pragma once
#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/uimanager/UIManagerCommitHook.h>

#include <memory>

#include "PropsRegistry.h"

using namespace facebook::react;

namespace reanimated {

class ReanimatedCommitHook : public UIManagerCommitHook {
 public:
  ReanimatedCommitHook(
      const std::shared_ptr<PropsRegistry> &propsRegistry,
      const std::shared_ptr<UIManager> &uiManager);

  ~ReanimatedCommitHook() noexcept override;

#if REACT_NATIVE_MINOR_VERSION >= 73
  void commitHookWasRegistered(UIManager const &) noexcept override {}

  void commitHookWasUnregistered(UIManager const &) noexcept override {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) noexcept override;
#else
  void commitHookWasRegistered(UIManager const &) const noexcept override {}

  void commitHookWasUnregistered(UIManager const &) const noexcept override {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode)
      const noexcept override;
#endif

 private:
  std::shared_ptr<PropsRegistry> propsRegistry_;

  std::shared_ptr<UIManager> uiManager_;
};

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
