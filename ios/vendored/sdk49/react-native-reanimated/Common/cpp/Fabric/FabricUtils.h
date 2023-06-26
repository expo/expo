#pragma once
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

#ifdef ANDROID
#include <fbjni/fbjni.h>
#include <react/fabric/Binding.h>
#endif
#include <react/renderer/uimanager/UIManager.h>

#include <memory>
#include <string>

using namespace ABI49_0_0facebook;
using namespace ABI49_0_0React;

namespace ABI49_0_0reanimated {

struct UIManagerBindingPublic {
  void *vtable;
  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<EventHandler const> eventHandler_;
};

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

#ifdef ANDROID
struct BindingPublic : public jni::HybridClass<Binding>,
                       public SchedulerDelegate,
                       public LayoutAnimationStatusDelegate {
  std::shared_mutex installMutex_;
  std::shared_ptr<FabricMountingManager> mountingManager_;
  std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::Scheduler> scheduler_;
};

struct SchedulerPublic : public UIManagerDelegate {
  SchedulerDelegate *delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  RuntimeExecutor runtimeExecutor_;
};

RuntimeExecutor getRuntimeExecutorFromBinding(Binding *binding);
#endif

std::shared_ptr<const ContextContainer> getContextContainerFromUIManager(
    const UIManager *uiManager);

} // namespace reanimated

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
