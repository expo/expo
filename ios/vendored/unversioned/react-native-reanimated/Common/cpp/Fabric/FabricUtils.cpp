#ifdef RCT_NEW_ARCH_ENABLED

#include "FabricUtils.h"

using namespace facebook::react;

struct UIManagerPublic {
  void *vtable;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
  UIManagerAnimationDelegate *animationDelegate_{nullptr};
  RuntimeExecutor const runtimeExecutor_{};
  ShadowTreeRegistry shadowTreeRegistry_{};
  BackgroundExecutor const backgroundExecutor_{};
  ContextContainer::Shared contextContainer_;
};

namespace reanimated {

const ContextContainer &getContextContainerFromUIManager(
    const UIManager &uiManager) {
  return *reinterpret_cast<const UIManagerPublic *>(&uiManager)
              ->contextContainer_;
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
