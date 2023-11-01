#pragma once
#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/uimanager/UIManager.h>

namespace reanimated {

const facebook::react::ContextContainer &getContextContainerFromUIManager(
    const facebook::react::UIManager &uiManager);

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
