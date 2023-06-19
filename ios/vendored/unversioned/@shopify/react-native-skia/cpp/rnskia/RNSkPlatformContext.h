#pragma once

#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <unordered_map>
#include <utility>

#include "RNSkDispatchQueue.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkData.h"
#include "SkImage.h"
#include "SkStream.h"
#include "SkSurface.h"

#pragma clang diagnostic pop

#include <jsi/jsi.h>

#include <ReactCommon/CallInvoker.h>

namespace RNSkia {

namespace jsi = facebook::jsi;
namespace react = facebook::react;

class RNSkPlatformContext {
public:
  /**
   * Constructor
   */
  RNSkPlatformContext(jsi::Runtime *runtime,
                      std::shared_ptr<react::CallInvoker> callInvoker,
                      float pixelDensity)
      : _pixelDensity(pixelDensity), _jsRuntime(runtime),
        _callInvoker(callInvoker),
        _dispatchQueue(
            std::make_unique<RNSkDispatchQueue>("skia-render-thread")) {
    _jsThreadId = std::this_thread::get_id();
  }

  /**
   * Destructor
   */
  virtual ~RNSkPlatformContext() { invalidate(); }

  void invalidate() {
    if (!_isValid) {
      return;
    }
    // Stop the refresh loop
    stopDrawLoop();
    // Notify draw loop listeners once with the invalidated parameter
    // set to true signalling that we are done and can clean up.
    notifyDrawLoop(true);
    _isValid = false;
  }

  /*
   Returns true if the current execution context is the javascript thread.
   */
  bool isOnJavascriptThread() {
    return _jsThreadId == std::this_thread::get_id();
  }

  /**
   * Schedules the function to be run on the javascript thread async
   * @param func Function to run
   */
  void runOnJavascriptThread(std::function<void()> func) {
    if (!_isValid) {
      return;
    }
    _callInvoker->invokeAsync(std::move(func));
  }

  /**
   Runs the function on the render thread
   */
  void runOnRenderThread(std::function<void()> func) {
    if (!_isValid) {
      return;
    }
    _dispatchQueue->dispatch(std::move(func));
  }

  /**
   * Runs the passed function on the main thread
   * @param func Function to run.
   */
  virtual void runOnMainThread(std::function<void()> func) = 0;

  /**
   * Takes a screenshot of a given view represented by the view tag
   * @param tag React view tag
   */
  virtual sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag) = 0;

  /**
   Returns the javascript runtime
   */
  jsi::Runtime *getJsRuntime() { return _jsRuntime; }

  /**
   * Returns an SkStream wrapping the require uri provided.
   * @param sourceUri Uri for the resource to load as a string
   * @op Operation to execute when the stream has successfuly been loaded.
   */
  virtual void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) = 0;

  /**
   * Raises an exception on the platform. This function does not necessarily
   * throw an exception and stop execution, so it is important to stop execution
   * by returning after calling the function
   * @param err Error to raise
   */
  virtual void raiseError(const std::exception &err) = 0;

  /**
   * Creates an offscreen surface
   * @param width Width of the offscreen surface
   * @param height Height of the offscreen surface
   * @return sk_sp<SkSurface>
   */
  virtual sk_sp<SkSurface> makeOffscreenSurface(int width, int height) = 0;

  /**
   * Creates an skImage containing the screenshot of a native view and its
   * children.
   * @param viewTag React viewtag
   * @param callback Called when image is ready or with null if something
   * failed.
   */
  virtual void
  makeViewScreenshot(int viewTag,
                     std::function<void(sk_sp<SkImage>)> callback) {
    runOnMainThread([this, callback, viewTag]() {
      callback(takeScreenshotFromViewTag(viewTag));
    });
  }

  /**
   * Raises an exception on the platform. This function does not necessarily
   * throw an exception and stop execution, so it is important to stop execution
   * by returning after calling the function
   * @param message Message to show
   */
  void raiseError(const std::string &message) {
    return raiseError(std::runtime_error(message));
  }

  /**
   * @return Current scale factor for pixels
   */
  float getPixelDensity() { return _pixelDensity; }

  /**
   * Starts (if not started) a loop that will call back on display sync
   * @param callback Callback to call on sync
   * @returns Identifier of the draw loop entry
   */
  size_t beginDrawLoop(size_t nativeId, std::function<void(bool)> callback) {
    if (!_isValid) {
      return 0;
    }
    auto shouldStart = false;
    {
      std::lock_guard<std::mutex> lock(_drawCallbacksLock);
      _drawCallbacks.emplace(nativeId, std::move(callback));
      shouldStart = _drawCallbacks.size() == 1;
    }
    if (shouldStart) {
      // Start
      startDrawLoop();
    }
    return nativeId;
  }

  /**
   * Ends (if running) the drawing loop that was started with beginDrawLoop.
   * This method must be called symmetrically with the beginDrawLoop method.
   * @param nativeId Identifier of view to end
   */
  void endDrawLoop(size_t nativeId) {
    if (!_isValid) {
      return;
    }
    auto shouldStop = false;
    {
      std::lock_guard<std::mutex> lock(_drawCallbacksLock);
      if (_drawCallbacks.count(nativeId) > 0) {
        _drawCallbacks.erase(nativeId);
      }
      shouldStop = _drawCallbacks.size() == 0;
    }
    if (shouldStop) {
      stopDrawLoop();
    }
  }

  /**
   * Notifies all drawing callbacks
   * @param invalidated True if the context was invalidated, otherwise false.
   * This can be used to receive a notification that we have stopped the main
   * drawloop
   */
  void notifyDrawLoop(bool invalidated) {
    if (!_isValid) {
      return;
    }
    std::lock_guard<std::mutex> lock(_drawCallbacksLock);
    for (auto it = _drawCallbacks.begin(); it != _drawCallbacks.end(); it++) {
      it->second(invalidated);
    }
  }

  // default implementation does nothing, so it can be called from virtual
  // destructor.
  virtual void startDrawLoop() {}
  virtual void stopDrawLoop() {}

private:
  float _pixelDensity;

  std::thread::id _jsThreadId;

  jsi::Runtime *_jsRuntime;
  std::shared_ptr<react::CallInvoker> _callInvoker;
  std::unique_ptr<RNSkDispatchQueue> _dispatchQueue;

  std::unordered_map<size_t, std::function<void(bool)>> _drawCallbacks;
  std::mutex _drawCallbacksLock;
  std::atomic<bool> _isValid = {true};
};
} // namespace RNSkia
