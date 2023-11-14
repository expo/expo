#pragma once
#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/uimanager/UIManager.h>

#include <memory>
#include <set>

using namespace facebook;
using namespace react;

namespace reanimated {

ShadowNode::Unshared cloneShadowTreeWithNewProps(
    const ShadowNode::Shared &oldRootNode,
    const ShadowNodeFamily &family,
    RawProps &&rawProps);

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
