#pragma once

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <memory>

#include "ABI49_0_0RNSkPlatformContext.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {
class CallInvoker;
}
} // namespace ABI49_0_0facebook

namespace ABI49_0_0RNSkia {
class ABI49_0_0RNSkView;
class ABI49_0_0RNSkJsiViewApi;

namespace jsi = ABI49_0_0facebook::jsi;
namespace ABI49_0_0React = ABI49_0_0facebook::ABI49_0_0React;

class ABI49_0_0RNSkManager {
public:
  /**
    Initialializes a new instance of the ABI49_0_0RNSkManager
    @param jsRuntime The main JavaScript runtime
    @param jsCallInvoker The callinvoker
    @param platformContext Context used by wrappers to get platform
    functionality
  */
  ABI49_0_0RNSkManager(jsi::Runtime *jsRuntime,
              std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> jsCallInvoker,
              std::shared_ptr<ABI49_0_0RNSkPlatformContext> platformContext);

  ~ABI49_0_0RNSkManager();

  /**
   Invalidates the Skia Manager
   */
  void invalidate();

  /**
   * Registers a ABI49_0_0RNSkView with the given native id
   * @param nativeId Native view id
   * @param view View to register
   */
  void registerSkiaView(size_t nativeId, std::shared_ptr<ABI49_0_0RNSkView> view);

  /**
   * Unregisters the ABI49_0_0RNSkView from the list of registered views
   * @param nativeId Native view Id
   */
  void unregisterSkiaView(size_t nativeId);

  /**
   Sets the view pointed to by nativeId to the provided value.
   Used when we want to remove a view without unregistering it
   - this happens typically on iOS.
   */
  void setSkiaView(size_t nativeId, std::shared_ptr<ABI49_0_0RNSkView> view);

  /**
   * @return The platform context
   */
  std::shared_ptr<ABI49_0_0RNSkPlatformContext> getPlatformContext() {
    return _platformContext;
  }

private:
  /**
   * Installs the javascript methods for registering/unregistering draw
   * callbacks for ABI49_0_0RNSkViews. Called on installation of the parent native
   * module.
   */
  void installBindings();

  jsi::Runtime *_jsRuntime;
  std::shared_ptr<ABI49_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> _jsCallInvoker;
  std::shared_ptr<ABI49_0_0RNSkJsiViewApi> _viewApi;
  std::atomic<bool> _isInvalidated = {false};
};

} // namespace ABI49_0_0RNSkia
