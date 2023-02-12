#include "ABI46_0_0RNSkManager.h"

#include <memory>
#include <utility>

#include <ABI46_0_0jsi/ABI46_0_0jsi.h>

#include <JsiSkApi.h>
#include <ABI46_0_0RNSkJsiViewApi.h>
#include <ABI46_0_0RNSkDrawView.h>
#include <ABI46_0_0RNSkValueApi.h>

namespace ABI46_0_0RNSkia {
using namespace ABI46_0_0facebook;

ABI46_0_0RNSkManager::ABI46_0_0RNSkManager(
    jsi::Runtime *jsRuntime,
    std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::CallInvoker> jsCallInvoker,
    std::shared_ptr<ABI46_0_0RNSkPlatformContext> platformContext)
    : _jsRuntime(jsRuntime), _jsCallInvoker(jsCallInvoker),
      _platformContext(platformContext),
      _viewApi(std::make_shared<ABI46_0_0RNSkJsiViewApi>(platformContext)) {

  // Install bindings
  installBindings();
}

ABI46_0_0RNSkManager::~ABI46_0_0RNSkManager() {
  invalidate();
  // Free up any references
  _viewApi = nullptr;
  _jsRuntime = nullptr;
  _platformContext = nullptr;
  _jsCallInvoker = nullptr;
}

void ABI46_0_0RNSkManager::invalidate() {
  if(_isInvalidated) {
    return;
  }
  _isInvalidated = true;
  
  // Invalidate members
  _viewApi->invalidate();
  _platformContext->invalidate();
}

void ABI46_0_0RNSkManager::registerSkiaDrawView(size_t nativeId, std::shared_ptr<ABI46_0_0RNSkDrawView> view) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->registerSkiaDrawView(nativeId, view);
}

void ABI46_0_0RNSkManager::unregisterSkiaDrawView(size_t nativeId) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->unregisterSkiaDrawView(nativeId);
}

void ABI46_0_0RNSkManager::setSkiaDrawView(size_t nativeId, std::shared_ptr<ABI46_0_0RNSkDrawView> view) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->setSkiaDrawView(nativeId, view);
}

void ABI46_0_0RNSkManager::installBindings() {
  // Create the API objects and install it on the global object in the
  // provided runtime.

  auto skiaApi = std::make_shared<JsiSkApi>(*_jsRuntime, _platformContext);
  _jsRuntime->global().setProperty(
      *_jsRuntime, "SkiaApi",
      jsi::Object::createFromHostObject(*_jsRuntime, std::move(skiaApi)));

  _jsRuntime->global().setProperty(
      *_jsRuntime, "SkiaViewApi",
      jsi::Object::createFromHostObject(*_jsRuntime, _viewApi));

  auto skiaValueApi = std::make_shared<ABI46_0_0RNSkValueApi>(_platformContext);
  _jsRuntime->global().setProperty(
    *_jsRuntime, "SkiaValueApi",
    jsi::Object::createFromHostObject(*_jsRuntime, std::move(skiaValueApi)));
}
} // namespace ABI46_0_0RNSkia
