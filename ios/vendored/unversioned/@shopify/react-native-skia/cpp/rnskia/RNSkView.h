
#pragma once

#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "JsiValueWrapper.h"
#include "RNSkPlatformContext.h"
#include "RNSkValue.h"

#include "JsiSkImage.h"
#include "JsiSkPoint.h"
#include "JsiSkRect.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"
#include "SkSurface.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class RNSkCanvasProvider {
public:
  explicit RNSkCanvasProvider(std::function<void()> requestRedraw)
      : _requestRedraw(requestRedraw) {}

  /**
   Returns the scaled width of the view
   */
  virtual float getScaledWidth() = 0;

  /**
   Returns the scaled height of the view
   */
  virtual float getScaledHeight() = 0;

  /**
   Render to a canvas
   */
  virtual bool renderToCanvas(const std::function<void(SkCanvas *)> &) = 0;

protected:
  std::function<void()> _requestRedraw;
};

class RNSkRenderer {
public:
  explicit RNSkRenderer(std::function<void()> requestRedraw)
      : _requestRedraw(requestRedraw) {}

  /**
   Tries to render the current set of drawing operations. If we're busy we'll
   return false so that the calling RNSkBaseDrawView can request a new render
   next frame. The tryRender method is typically called on each frame if there
   are any redraw requests. The method will be called from the main thread, so
   the implementor must make sure any thread requirements are met before
   rendering. This method will also allow the rendering to be dispatched to
   another thread.
   */
  virtual bool
  tryRender(std::shared_ptr<RNSkCanvasProvider> canvasProvider) = 0;

  /**
   Renders directly to the canvas in the canvas provider. This method is called
   from a Javascript call to render a snapshot of the SkiaView to an image, and
   can therefore run outside the tryRender loop and directly in the javascript
   thread.
   */
  virtual void
  renderImmediate(std::shared_ptr<RNSkCanvasProvider> canvasProvider) = 0;

  void setShowDebugOverlays(bool showDebugOverlays) {
    _showDebugOverlays = showDebugOverlays;
  }
  bool getShowDebugOverlays() { return _showDebugOverlays; }

protected:
  std::function<void()> _requestRedraw;
  bool _showDebugOverlays;
};

class RNSkImageCanvasProvider : public RNSkCanvasProvider {
public:
  RNSkImageCanvasProvider(std::shared_ptr<RNSkPlatformContext> context,
                          std::function<void()> requestRedraw, float width,
                          float height)
      : RNSkCanvasProvider(requestRedraw), _width(width), _height(height) {
    _surface = context->makeOffscreenSurface(_width, _height);
  }

  /**
   Returns a snapshot of the current surface/canvas
   */
  sk_sp<SkImage> makeSnapshot(std::shared_ptr<SkRect> bounds) {
    sk_sp<SkImage> image;
    if (bounds != nullptr) {
      SkIRect b = SkIRect::MakeXYWH(bounds->x(), bounds->y(), bounds->width(),
                                    bounds->height());
      image = _surface->makeImageSnapshot(b);
    } else {
      image = _surface->makeImageSnapshot();
    }
    return image->makeNonTextureImage();
  }

  /**
   Returns the scaled width of the view
   */
  float getScaledWidth() override { return _width; };

  /**
   Returns the scaled height of the view
   */
  float getScaledHeight() override { return _height; };

  /**
   Render to a canvas
   */
  bool renderToCanvas(const std::function<void(SkCanvas *)> &cb) override {
    cb(_surface->getCanvas());
    return true;
  };

private:
  float _width;
  float _height;
  sk_sp<SkSurface> _surface;
};

enum RNSkDrawingMode { Default, Continuous };

using RNSkTouchInfo = struct {
  enum TouchType { Start, Active, End, Cancelled };
  double x;
  double y;
  double force;
  TouchType type;
  size_t id;
  long timestamp;
};

class RNSkView : public std::enable_shared_from_this<RNSkView> {
public:
  /**
   * Constructor
   */
  RNSkView(std::shared_ptr<RNSkPlatformContext> context,
           std::shared_ptr<RNSkCanvasProvider> canvasProvider,
           std::shared_ptr<RNSkRenderer> renderer)
      : _platformContext(context), _canvasProvider(canvasProvider),
        _renderer(renderer) {}

  /**
   Destructor
   */
  virtual ~RNSkView() {
    endDrawingLoop();
    if (_onSizeUnsubscribe != nullptr) {
      _onSizeUnsubscribe();
      _onSizeUnsubscribe = nullptr;
    }
  }

  /**
   Sets custom properties. Custom properties are properties that are set
   directly from Javascript without having to go through the async bridge.
   */
  virtual void setJsiProperties(
      std::unordered_map<std::string, RNJsi::JsiValueWrapper> &props) {

    for (auto &prop : props) {
      if (prop.first == "onSize") {
        // Start by removing any subscribers to the current onSize
        if (_onSizeUnsubscribe != nullptr) {
          _onSizeUnsubscribe();
          _onSizeUnsubscribe = nullptr;
        }
        if (prop.second.isUndefinedOrNull()) {
          // Clear touchCallback
          _onSize = nullptr;
        } else if (prop.second.getType() !=
                   RNJsi::JsiWrapperValueType::HostObject) {
          // We expect a function for the draw callback custom property
          throw std::runtime_error(
              "Expected a Skia mutable value for the onSize property.");
        }
        // Save onSize
        _onSize =
            std::dynamic_pointer_cast<RNSkValue>(prop.second.getAsHostObject());

        // Add listener
        _onSizeUnsubscribe =
            _onSize->addListener([weakSelf = weak_from_this()](jsi::Runtime &) {
              auto self = weakSelf.lock();
              if (self) {
                self->requestRedraw();
              }
            });
      }
    }
  }

  /**
   Calls a custom action.
   */
  virtual jsi::Value callJsiMethod(jsi::Runtime &runtime,
                                   const std::string &name,
                                   const jsi::Value *arguments, size_t count) {
    throw std::runtime_error(
        "The base Skia View does not support any commands. Command " + name +
        " not found.");
  }

  /**
   * Repaints the Skia view using the underlying context and the drawcallback.
   * This method schedules a draw request that will be run on the correct
   * thread and js runtime.
   */
  void requestRedraw() { _redrawRequestCounter++; }

  /**
   Renders immediate. Be carefull to not call this method from another thread
   than the UI thread
   */
  void renderImmediate() {
    _renderer->renderImmediate(_canvasProvider);
    _redrawRequestCounter = 0;
  }

  /**
   Sets the native id of the view
   */
  virtual void setNativeId(size_t nativeId) {
    _nativeId = nativeId;
    beginDrawingLoop();
  }

  /**
   Returns the native id
   */
  size_t getNativeId() { return _nativeId; }

  /**
   Sets the drawing mode for the view
   */
  void setDrawingMode(RNSkDrawingMode mode) {
    _drawingMode = mode;
    requestRedraw();
  }

  /**
   * Set to true to show the debug overlays on render
   */
  void setShowDebugOverlays(bool show) {
    _renderer->setShowDebugOverlays(show);
    requestRedraw();
  }

  /**
    Update touch state with new touch points
   */
  virtual void updateTouchState(std::vector<RNSkTouchInfo> &) {
    requestRedraw();
  }

  /**
   Renders the view into an SkImage instead of the screen.
   */
  sk_sp<SkImage> makeImageSnapshot(std::shared_ptr<SkRect> bounds) {

    auto provider = std::make_shared<RNSkImageCanvasProvider>(
        getPlatformContext(), std::bind(&RNSkView::requestRedraw, this),
        _canvasProvider->getScaledWidth(), _canvasProvider->getScaledHeight());

    _renderer->renderImmediate(provider);
    return provider->makeSnapshot(bounds);
  }

protected:
  std::shared_ptr<RNSkPlatformContext> getPlatformContext() {
    return _platformContext;
  }
  std::shared_ptr<RNSkCanvasProvider> getCanvasProvider() {
    return _canvasProvider;
  }
  std::shared_ptr<RNSkRenderer> getRenderer() { return _renderer; }

  /**
   Ends an ongoing beginDrawCallback loop for this view. This method is made
   protected if the drawing loop should be stopped before reaching the
   destructor (like we do for Android views)
   */
  void endDrawingLoop() {
    if (_drawingLoopId != 0) {
      _drawingLoopId = 0;
      _platformContext->endDrawLoop(_nativeId);
    }
  }

private:
  /**
   Starts beginDrawCallback loop if the drawing mode is continuous
   */
  void beginDrawingLoop() {
    if (_drawingLoopId != 0 || _nativeId == 0) {
      return;
    }
    // Set to zero to avoid calling beginDrawLoop before we return
    _drawingLoopId = _platformContext->beginDrawLoop(
        _nativeId, [weakSelf = weak_from_this()](bool invalidated) {
          auto self = weakSelf.lock();
          if (self) {
            self->drawLoopCallback(invalidated);
          }
        });
  }

  void updateOnSize() {
    if (_onSize != nullptr) {
      auto width = _canvasProvider->getScaledWidth() /
                   _platformContext->getPixelDensity();
      auto height = _canvasProvider->getScaledHeight() /
                    _platformContext->getPixelDensity();

      _platformContext->runOnJavascriptThread(
          [width, height, weakSelf = weak_from_this()]() {
            auto self = weakSelf.lock();
            if (self) {
              auto runtime = self->_platformContext->getJsRuntime();
              auto onSize = self->_onSize->getCurrent(*runtime);
              if (!onSize.isObject()) {
                throw jsi::JSError(
                    *runtime,
                    "Expected onSize property to be a mutable Skia value.");
                return;
              }
              auto onSizeObj = onSize.asObject(*runtime);

              // Is this a host SkSize object?
              if (onSizeObj.isHostObject(*runtime)) {
                auto point = std::dynamic_pointer_cast<JsiSkPoint>(
                    onSizeObj.asHostObject(*runtime));
                if (point == nullptr) {
                  throw jsi::JSError(*runtime,
                                     "Expected onSize property to be a mutable "
                                     "Skia value of type SkSize.");
                  return;
                }

                auto w = point->getObject()->x();
                auto h = point->getObject()->y();
                if (w != width || h != height) {
                  auto nextSize =
                      std::make_shared<SkPoint>(SkPoint::Make(width, height));
                  point->setObject(nextSize);
                  self->_onSize->set_current(*runtime, onSize);
                }

              } else {
                auto wVal = onSizeObj.getProperty(*runtime, "width");
                auto hVal = onSizeObj.getProperty(*runtime, "height");

                if (!wVal.isNumber() || !hVal.isNumber()) {
                  throw jsi::JSError(*runtime,
                                     "Expected onSize property to be a mutable "
                                     "Skia value of type SkSize.");
                  return;
                }

                auto w = wVal.asNumber();
                auto h = hVal.asNumber();

                if (w != width || h != height) {
                  // Update
                  onSizeObj.setProperty(*runtime, "width", width);
                  onSizeObj.setProperty(*runtime, "height", height);
                  self->_onSize->set_current(*runtime, onSize);
                }
              }
            }
          });
    }
  }

  /**
    Draw loop callback
   */
  void drawLoopCallback(bool invalidated) {
    if (_redrawRequestCounter > 0 ||
        _drawingMode == RNSkDrawingMode::Continuous) {
      _redrawRequestCounter = 0;

      // Update size if needed
      updateOnSize();

      if (!_renderer->tryRender(_canvasProvider)) {
        // The renderer could not render cause it was busy, just schedule
        // redrawing on the next frame.
        requestRedraw();
      }
    }
  }

  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::shared_ptr<RNSkCanvasProvider> _canvasProvider;
  std::shared_ptr<RNSkRenderer> _renderer;

  std::shared_ptr<RNSkValue> _onSize;
  std::function<void()> _onSizeUnsubscribe;
  RNSkDrawingMode _drawingMode;
  size_t _nativeId;

  size_t _drawingLoopId = 0;
  std::atomic<int> _redrawRequestCounter = {1};
  bool _initialDrawingDone = false;
};

} // namespace RNSkia
