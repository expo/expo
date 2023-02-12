
#pragma once

#include <memory>

#include <ABI47_0_0RNSkPlatformContext.h>

#include <JsiValueWrapper.h>

#include <JsiSkRect.h>
#include <JsiSkImage.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkSurface.h>
#include <SkCanvas.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class ABI47_0_0RNSkCanvasProvider {
public:
  ABI47_0_0RNSkCanvasProvider(std::function<void()> requestRedraw): _requestRedraw(requestRedraw) {}
  
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
  virtual void renderToCanvas(const std::function<void(SkCanvas*)>&) = 0;
protected:
  std::function<void()> _requestRedraw;
};

class ABI47_0_0RNSkRenderer {
public:
  ABI47_0_0RNSkRenderer(std::function<void()> requestRedraw): _requestRedraw(requestRedraw) {}
  
  /**
   Tries to render the current set of drawing operations. If we're busy we'll return false so that the calling ABI47_0_0RNSkBaseDrawView
   can request a new render next frame. The tryRender method is typically called on each frame if there are any redraw
   requests. The method will be called from the main thread, so the implementor must make sure any thread requirements are
   met before rendering. This method will also allow the rendering to be dispatched to another thread.
   */
  virtual bool tryRender(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) = 0;
  
  /**
   Renders directly to the canvas in the canvas provider. This method is called from a Javascript call to render a
   snapshot of the SkiaView to an image, and can therefore run outside the tryRender loop and directly in the
   javascript thread.
   */
  virtual void renderImmediate(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) = 0;
  
  void setShowDebugOverlays(bool showDebugOverlays) { _showDebugOverlays = showDebugOverlays; }
  bool getShowDebugOverlays() { return _showDebugOverlays; }
  
protected:
  std::function<void()> _requestRedraw;
  bool _showDebugOverlays;
};

class ABI47_0_0RNSkImageCanvasProvider: public ABI47_0_0RNSkCanvasProvider {
public:
  ABI47_0_0RNSkImageCanvasProvider(std::function<void()> requestRedraw,
                          float width,
                          float height):
    ABI47_0_0RNSkCanvasProvider(requestRedraw),
    _width(width),
    _height(height) {
    _surface = SkSurface::MakeRasterN32Premul(_width, _height);
  }
  
  /**
   Returns a snapshot of the current surface/canvas
   */
  sk_sp<SkImage> makeSnapshot(std::shared_ptr<SkRect> bounds) {
    if(bounds != nullptr) {
      SkIRect b = SkIRect::MakeXYWH(bounds->x(), bounds->y(), bounds->width(), bounds->height());
      return _surface->makeImageSnapshot(b);
    } else {
      return _surface->makeImageSnapshot();
    }
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
  void renderToCanvas(const std::function<void(SkCanvas*)>& cb) override {
    cb(_surface->getCanvas());
  };
  
private:
  float _width;
  float _height;
  sk_sp<SkSurface> _surface;
};

enum ABI47_0_0RNSkDrawingMode { Default, Continuous };

using ABI47_0_0RNSkTouchInfo = struct {
  enum TouchType { Start, Active, End, Cancelled };
  double x;
  double y;
  double force;
  TouchType type;
  size_t id;
  long timestamp;
};

class ABI47_0_0RNSkView: public std::enable_shared_from_this<ABI47_0_0RNSkView> {
public:
  /**
   * Constructor
   */
  ABI47_0_0RNSkView(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
           std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider,
           std::shared_ptr<ABI47_0_0RNSkRenderer> renderer):
    _platformContext(context),
    _canvasProvider(canvasProvider),
    _renderer(renderer) {}

  /**
   Destructor
   */
  virtual ~ABI47_0_0RNSkView() {
    endDrawingLoop();
  }
  
  /**
   Sets custom properties. Custom properties are properties that are set directly from Javascript without having
   to go through the async bridge.
   */
  virtual void setJsiProperties(std::unordered_map<std::string, ABI47_0_0RNJsi::JsiValueWrapper> &props) {
    throw std::runtime_error("The base Skia View does not support any custom properties.");
  };
  
  /**
   Calls a custom action.
   */
  virtual jsi::Value callJsiMethod(jsi::Runtime& runtime,
                                   const std::string& name,
                                   const jsi::Value *arguments,
                                   size_t count) {
    throw std::runtime_error("The base Skia View does not support any commands. Command " + name + " not found.");
  };

  /**
   * Repaints the Skia view using the underlying context and the drawcallback.
   * This method schedules a draw request that will be run on the correct
   * thread and js runtime.
   */
  void requestRedraw() {
    _redrawRequestCounter++;
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
  void setDrawingMode(ABI47_0_0RNSkDrawingMode mode) {
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
  virtual void updateTouchState(std::vector<ABI47_0_0RNSkTouchInfo>&) {
    requestRedraw();
  }
  
  /**
   Renders the view into an SkImage instead of the screen.
   */
  sk_sp<SkImage> makeImageSnapshot(std::shared_ptr<SkRect> bounds) {
    auto provider = std::make_shared<ABI47_0_0RNSkImageCanvasProvider>(std::bind(&ABI47_0_0RNSkView::requestRedraw, this),
                                                              _canvasProvider->getScaledWidth(),
                                                              _canvasProvider->getScaledHeight());
    
    _renderer->renderImmediate(provider);
    return provider->makeSnapshot(bounds);
  }

protected:
  std::shared_ptr<ABI47_0_0RNSkPlatformContext> getPlatformContext() { return _platformContext; }
  std::shared_ptr<ABI47_0_0RNSkCanvasProvider> getCanvasProvider() { return _canvasProvider; }
  std::shared_ptr<ABI47_0_0RNSkRenderer> getRenderer() { return _renderer; }

  /**
   Ends an ongoing beginDrawCallback loop for this view. This method is made protected if
   the drawing loop should be stopped before reaching the destructor (like we do for Android
   views)
   */
  void endDrawingLoop() {
    if(_drawingLoopId != 0) {
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
    _drawingLoopId = _platformContext->beginDrawLoop(_nativeId,
      [weakSelf = weak_from_this()](bool invalidated) {
      auto self = weakSelf.lock();
      if(self) {
        self->drawLoopCallback(invalidated);
      }
    });
  }

  /**
    Draw loop callback
   */
  void drawLoopCallback(bool invalidated) {
    if(_redrawRequestCounter > 0 || _drawingMode == ABI47_0_0RNSkDrawingMode::Continuous) {
        _redrawRequestCounter = 0;
        
      if(!_renderer->tryRender(_canvasProvider)) {
        // The renderer could not render cause it was busy, just schedule redrawing
        // on the next frame.
        requestRedraw();
      }
    }
  }
  
  std::shared_ptr<ABI47_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<ABI47_0_0RNSkCanvasProvider> _canvasProvider;
  std::shared_ptr<ABI47_0_0RNSkRenderer> _renderer;

  ABI47_0_0RNSkDrawingMode _drawingMode;
  size_t _nativeId;
  
  size_t _drawingLoopId = 0;
  std::atomic<int> _redrawRequestCounter = { 1 };
};

} // namespace ABI47_0_0RNSkia
