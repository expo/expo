#include "RNSkManager.h"

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include <JsiSkApi.h>
#include <RNSkJsiViewApi.h>
#include <RNSkDrawView.h>
#include <RNSkValueApi.h>

namespace RNSkia {
using namespace facebook;

RNSkManager::RNSkManager(
    jsi::Runtime *jsRuntime,
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
    std::shared_ptr<RNSkPlatformContext> platformContext)
    : _jsRuntime(jsRuntime), _jsCallInvoker(jsCallInvoker),
      _platformContext(platformContext),
      _viewApi(std::make_shared<RNSkJsiViewApi>(platformContext)) {

  // Install bindings
  installBindings();
}

RNSkManager::~RNSkManager() {
  invalidate();
  // Free up any references
  _viewApi = nullptr;
  _jsRuntime = nullptr;
  _platformContext = nullptr;
  _jsCallInvoker = nullptr;
}

void RNSkManager::invalidate() {
  if(_isInvalidated) {
    return;
  }
  _isInvalidated = true;
  
  // Invalidate members
  _viewApi->invalidate();
  _platformContext->invalidate();
}

void RNSkManager::registerSkiaDrawView(size_t nativeId, std::shared_ptr<RNSkDrawView> view) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->registerSkiaDrawView(nativeId, view);
}

void RNSkManager::unregisterSkiaDrawView(size_t nativeId) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->unregisterSkiaDrawView(nativeId);
}

void RNSkManager::setSkiaDrawView(size_t nativeId, std::shared_ptr<RNSkDrawView> view) {
  if (!_isInvalidated && _viewApi != nullptr)
    _viewApi->setSkiaDrawView(nativeId, view);
}

void RNSkManager::installBindings() {
  // Create the API objects and install it on the global object in the
  // provided runtime.

  auto skiaApi = std::make_shared<JsiSkApi>(*_jsRuntime, _platformContext);
  _jsRuntime->global().setProperty(
      *_jsRuntime, "SkiaApi",
      jsi::Object::createFromHostObject(*_jsRuntime, std::move(skiaApi)));

  _jsRuntime->global().setProperty(
      *_jsRuntime, "SkiaViewApi",
      jsi::Object::createFromHostObject(*_jsRuntime, _viewApi));

  auto skiaValueApi = std::make_shared<RNSkValueApi>(_platformContext);
  _jsRuntime->global().setProperty(
    *_jsRuntime, "SkiaValueApi",
    jsi::Object::createFromHostObject(*_jsRuntime, std::move(skiaValueApi)));
}
} // namespace RNSkia
