#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

#include "FabricUtils.h"

#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

namespace ABI49_0_0reanimated {

#ifdef ANDROID
RuntimeExecutor getRuntimeExecutorFromBinding(Binding *binding) {
  BindingPublic *bindingPublic = reinterpret_cast<BindingPublic *>(binding);
  SchedulerPublic *schedulerPublic =
      reinterpret_cast<SchedulerPublic *>((bindingPublic->scheduler_).get());
  return schedulerPublic->runtimeExecutor_;
}
#endif

std::shared_ptr<const ContextContainer> getContextContainerFromUIManager(
    const UIManager *uiManager) {
  return reinterpret_cast<const UIManagerPublic *>(uiManager)
      ->contextContainer_;
}

} // namespace reanimated

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
