#pragma once
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/uimanager/UIManager.h>

#include <memory>
#include <set>

#include "NewestShadowNodesRegistry.h"

using namespace ABI49_0_0facebook;
using namespace ABI49_0_0React;

namespace ABI49_0_0reanimated {

class ShadowTreeCloner {
 public:
  ShadowTreeCloner(
      std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry,
      std::shared_ptr<UIManager> uiManager,
      SurfaceId surfaceId);

  ~ShadowTreeCloner();

  ShadowNode::Unshared cloneWithNewProps(
      const ShadowNode::Shared &oldRootNode,
      const ShadowNodeFamily &family,
      RawProps &&rawProps);

  void updateYogaChildren();

 private:
  std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry_;
  PropsParserContext propsParserContext_;
  std::set<ShadowNode *> yogaChildrenUpdates_;
};

} // namespace reanimated

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
