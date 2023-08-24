#pragma once
#ifdef RCT_NEW_ARCH_ENABLED

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#include <memory>

#include "NewestShadowNodesRegistry.h"

using namespace facebook;
using namespace react;

namespace reanimated {

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

#endif // RCT_NEW_ARCH_ENABLED
