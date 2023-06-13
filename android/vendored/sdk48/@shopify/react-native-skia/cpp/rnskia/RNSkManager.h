#pragma once

#include <jsi/jsi.h>
#include <memory>

#include "RNSkPlatformContext.h"

namespace facebook {
namespace react {
class CallInvoker;
}
} // namespace facebook

namespace RNSkia {
class RNSkView;
class RNSkJsiViewApi;

namespace jsi = facebook::jsi;
namespace react = facebook::react;

class RNSkManager {
public:
  /**
    Initialializes a new instance of the RNSkManager
    @param jsRuntime The main JavaScript runtime
    @param jsCallInvoker The callinvoker
    @param platformContext Context used by wrappers to get platform
    functionality
  */
  RNSkManager(jsi::Runtime *jsRuntime,
              std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
              std::shared_ptr<RNSkPlatformContext> platformContext);

  ~RNSkManager();

  /**
   Invalidates the Skia Manager
   */
  void invalidate();

  /**
   * Registers a RNSkView with the given native id
   * @param nativeId Native view id
   * @param view View to register
   */
  void registerSkiaView(size_t nativeId, std::shared_ptr<RNSkView> view);

  /**
   * Unregisters the RNSkView from the list of registered views
   * @param nativeId Native view Id
   */
  void unregisterSkiaView(size_t nativeId);

  /**
   Sets the view pointed to by nativeId to the provided value.
   Used when we want to remove a view without unregistering it
   - this happens typically on iOS.
   */
  void setSkiaView(size_t nativeId, std::shared_ptr<RNSkView> view);

  /**
   * @return The platform context
   */
  std::shared_ptr<RNSkPlatformContext> getPlatformContext() {
    return _platformContext;
  }

private:
  /**
   * Installs the javascript methods for registering/unregistering draw
   * callbacks for RNSkViews. Called on installation of the parent native
   * module.
   */
  void installBindings();

  jsi::Runtime *_jsRuntime;
  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::shared_ptr<facebook::react::CallInvoker> _jsCallInvoker;
  std::shared_ptr<RNSkJsiViewApi> _viewApi;
  std::atomic<bool> _isInvalidated = {false};
};

} // namespace RNSkia
