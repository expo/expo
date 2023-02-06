#pragma once

#include "JsiHostObject.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkCanvas.h>
#include <SkPaint.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

class DrawingContext : public std::enable_shared_from_this<DrawingContext> {
public:
  /**
   Creates a root drawing context with paint and opacity
   */
  explicit DrawingContext(std::shared_ptr<SkPaint> paint);

  /**
   Initilalizes a new draw context.
   */
  DrawingContext(DrawingContext *parent, const char *source);

  /**
   Factory for creating a child context that inherits from this context
   */
  std::shared_ptr<DrawingContext> inheritContext(const char *source);

  /**
   Returns the debug description for the context
   */
  std::string getDebugDescription();

  /**
   Mark the drawing context and any child contexts as changed
   */
  void markAsChanged();

  /**
   Call to reset invalidate flag after render cycle
   */
  void resetChangedFlag();

  /**
   Dispose and remove the drawing context from its parent.
   */
  void dispose();

  /**
   Returns true if the current cache is changed
   */
  bool isChanged();

  /**
   Get/Sets the canvas object
   */
  SkCanvas *getCanvas();

  /**
   Sets the canvas
   */
  void setCanvas(SkCanvas *canvas);

  /**
   Gets the paint object
   */
  std::shared_ptr<const SkPaint> getPaint();

  /**
   To be able to mutate and change the paint in a context we need to mutate the
   underlying paint object - otherwise we'll just use the parent paint object
   (to avoid having to create multiple paint objects for nodes that does not
   change the paint).
   */
  std::shared_ptr<SkPaint> getMutablePaint();

  /**
   Sets the paint in the current sub context
   */
  void setMutablePaint(std::shared_ptr<SkPaint> paint);

  float getScaledWidth();

  float getScaledHeight();

  void setScaledWidth(float v);
  void setScaledHeight(float v);

  void setRequestRedraw(std::function<void()> &&requestRedraw);
  const std::function<void()> &getRequestRedraw();

  DrawingContext *getParent();

private:
  explicit DrawingContext(const char *source);

  void markChildrenAsChanged();

  bool _isChanged = true;

  std::shared_ptr<SkPaint> _paint;

  SkCanvas *_canvas = nullptr;
  const char *_source;

  DrawingContext *_parent = nullptr;
  std::vector<std::shared_ptr<DrawingContext>> _children;

  float _scaledWidth = -1;
  float _scaledHeight = -1;

  std::function<void()> _requestRedraw;
};

} // namespace ABI48_0_0RNSkia
