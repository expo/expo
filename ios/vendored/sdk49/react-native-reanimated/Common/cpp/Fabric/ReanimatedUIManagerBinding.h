#pragma once
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#include <memory>

#include "NewestShadowNodesRegistry.h"

using namespace ABI49_0_0facebook;
using namespace ABI49_0_0React;

namespace ABI49_0_0reanimated {

class ReanimatedUIManagerBinding : public UIManagerBinding {
 public:
  static void createAndInstallIfNeeded(
      jsi::Runtime &runtime,
      RuntimeExecutor const &runtimeExecutor,
      std::shared_ptr<UIManager> const &uiManager,
      std::shared_ptr<NewestShadowNodesRegistry> const
          &newestShadowNodesRegistry);

  ReanimatedUIManagerBinding(
      std::shared_ptr<UIManager> uiManager,
      RuntimeExecutor runtimeExecutor,
      std::unique_ptr<EventHandler const> eventHandler,
      std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry);

  ~ReanimatedUIManagerBinding();

  void invalidate() const;

  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;

 private:
  std::shared_ptr<UIManager> uiManager_;
  std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry_;
};

} // namespace reanimated

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
