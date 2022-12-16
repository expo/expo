#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <vector>
#include <string>

#include <jsi/jsi.h>

#include <RNSkInfoParameter.h>
#include <RNSkPlatformContext.h>
#include <RNSkTimingInfo.h>
#include <RNSkLog.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkRefCnt.h>

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace RNSkia {
class JsiSkCanvas;
using namespace facebook;
using RNSkDrawCallback =
    std::function<void(std::shared_ptr<JsiSkCanvas>, int, int, double,
                       std::shared_ptr<RNSkPlatformContext>)>;

enum RNSkDrawingMode { Default, Continuous };

class RNSkDrawView: public std::enable_shared_from_this<RNSkDrawView> {
public:
  /**
   * Constructor
   */
  RNSkDrawView(std::shared_ptr<RNSkPlatformContext> context);

  /**
   Destructor
   */
  virtual ~RNSkDrawView();

  /**
   * Repaints the Skia view using the underlying context and the drawcallback.
   * This method schedules a draw request that will be run on the correct
   * thread and js runtime.
   */
  void requestRedraw();
  
  /**
   Calls the drawing callback on the javascript thread
   */
  void performDraw();

  /**
   * Installs the draw callback for the view
   */
  void setDrawCallback(std::shared_ptr<jsi::Function> callback);
  
  /**
   Sets the native id of the view
   */
  void setNativeId(size_t nativeId);
  
  /**
   Returns the native id
   */
  size_t getNativeId() { return _nativeId; }
  
  /**
   Sets the drawing mode for the view
   */
  void setDrawingMode(RNSkDrawingMode mode);

  /**
   * Set to true to show the debug overlays on render
   */
  void setShowDebugOverlays(bool show) { _showDebugOverlay = show; }

  /**
    Update touch state with new touch points
   */
  void updateTouchState(std::vector<RNSkTouchPoint>&& points);
  
  /**
   Draws the view's surface into an image
   return an SkImage
   */
  sk_sp<SkImage> makeImageSnapshot(std::shared_ptr<SkRect> bounds);

protected:
  /**
   Returns the scaled width of the view
   */
  virtual float getScaledWidth() = 0;
  
  /**
   Returns the scaled height of the view
   */
  virtual float getScaledHeight() = 0;
  
  /**
   Override to render picture to GPU
   */
  virtual void drawPicture(const sk_sp<SkPicture> picture) = 0;
  
  /**
   * @return The platformcontext
   */
  std::shared_ptr<RNSkPlatformContext> getPlatformContext() {
    return _platformContext;
  }

private:  
  /**
   Starts beginDrawCallback loop if the drawing mode is continuous
   */
  void beginDrawingLoop();

  /**
   Ends an ongoing beginDrawCallback loop for this view
   */
  void endDrawingLoop();
  
  /**
    Draw loop callback
   */
  void drawLoopCallback(bool invalidated);
  
  /**
   Draw in canvas
   */
  void drawInCanvas(std::shared_ptr<JsiSkCanvas> canvas,
                    int width,
                    int height,
                    double time);
  
  /**
   * Stores the draw drawCallback
   */
  std::shared_ptr<RNSkDrawCallback> _drawCallback;

  /**
   * Stores a pointer to the jsi wrapper for the canvas. The reason for
   * storing this pointer and not recreate it is that it creates a set of
   * functions that we don't want to recreate on each render
   */
  std::shared_ptr<JsiSkCanvas> _jsiCanvas;
  
  /**
   * JS Drawing mutex
   */
  std::shared_ptr<std::timed_mutex> _jsDrawingLock;
  
  /**
   * SKIA Drawing mutex
   */
  std::shared_ptr<std::timed_mutex> _gpuDrawingLock;

  /**
   * Pointer to the platform context
   */
  std::shared_ptr<RNSkPlatformContext> _platformContext;

  /**
   Drawing mode
   */
  RNSkDrawingMode _drawingMode;

  /**
   * Show debug overlays
   */
  bool _showDebugOverlay = false;

  /**
   * True if the drawing loop has been requested
   */
  size_t _drawingLoopId = 0;

  /**
   * Info object parameter
   */
  std::shared_ptr<RNSkInfoObject> _infoObject;

  /**
   Timing information for javascript drawing
   */
  RNSkTimingInfo _jsTimingInfo;
  
  /**
   Timing information for GPU rendering
   */
  RNSkTimingInfo _gpuTimingInfo;  
  
  /**
   Redraw queue counter
   */
  std::atomic<int> _redrawRequestCounter = { 1 };
  
  /**
   * Native id
   */
  size_t _nativeId;
  
};

} // namespace RNSkia
