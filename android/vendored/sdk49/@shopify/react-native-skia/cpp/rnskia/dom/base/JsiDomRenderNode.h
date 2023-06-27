
#pragma once

#include "ClipProp.h"
#include "DrawingContext.h"
#include "JsiDomDeclarationNode.h"
#include "JsiDomNode.h"
#include "LayerProp.h"
#include "MatrixProp.h"
#include "PaintProps.h"
#include "PointProp.h"
#include "RRectProp.h"
#include "RectProp.h"
#include "TransformProp.h"

#include <memory>
#include <string>
#include <vector>

namespace RNSkia {

class JsiDomRenderNode : public JsiDomNode {
public:
  JsiDomRenderNode(std::shared_ptr<RNSkPlatformContext> context,
                   const char *type)
      : JsiDomNode(context, type, NodeClass::RenderNode) {}

  void render(DrawingContext *context) {
#if SKIA_DOM_DEBUG
    printDebugInfo("Begin Render");
#endif

    auto parentPaint = context->getPaint();
    auto cache =
        _paintCache.parent == parentPaint ? _paintCache.child : nullptr;

    auto shouldRestore =
        context->saveAndConcat(_paintProps, getChildren(), cache);

    auto shouldTransform = _matrixProp->isSet() || _transformProp->isSet();
    auto shouldSave =
        shouldTransform || _clipProp->isSet() || _layerProp->isSet();

    // Handle matrix/transforms
    if (shouldSave) {
      // Save canvas state
      if (_layerProp->isSet()) {
        if (_layerProp->isBool()) {
#if SKIA_DOM_DEBUG_VERBOSE
          printDebugInfo("canvas->saveLayer()");
#endif
          context->getCanvas()->saveLayer(
              SkCanvas::SaveLayerRec(nullptr, nullptr, nullptr, 0));
        } else {
#if SKIA_DOM_DEBUG_VERBOSE
          printDebugInfo("canvas->saveLayer(paint)");
#endif
          context->getCanvas()->saveLayer(SkCanvas::SaveLayerRec(
              nullptr, _layerProp->getDerivedValue().get(), nullptr, 0));
        }
      } else {
#if SKIA_DOM_DEBUG_VERBOSE
        printDebugInfo("canvas->save()");
#endif
        context->getCanvas()->save();
      }

      if (_originProp->isSet()) {
#if SKIA_DOM_DEBUG_VERBOSE
        printDebugInfo("canvas->translate(origin)");
#endif
        // Handle origin
        context->getCanvas()->translate(_originProp->getDerivedValue()->x(),
                                        _originProp->getDerivedValue()->y());
      }

      if (shouldTransform) {
#if SKIA_DOM_DEBUG_VERBOSE
        printDebugInfo(
            "canvas->concat(" +
            std::string(_matrixProp->isSet() ? "matrix" : "transform") +
            std::string(")"));
#endif
        auto matrix = _matrixProp->isSet() ? _matrixProp->getDerivedValue()
                                           : _transformProp->getDerivedValue();

        // Concat canvas' matrix with our matrix
        context->getCanvas()->concat(*matrix);
      }

      // Clipping
      if (_clipProp->isSet()) {
        auto invert = _invertClip->isSet() && _invertClip->value().getAsBool();
        clip(context, context->getCanvas(), invert);
      }

      if (_originProp->isSet()) {
#if SKIA_DOM_DEBUG_VERBOSE
        printDebugInfo("canvas->translate(-origin)");
#endif
        // Handle origin
        context->getCanvas()->translate(-_originProp->getDerivedValue()->x(),
                                        -_originProp->getDerivedValue()->y());
      }
    }

    // Render the node
    renderNode(context);

    // Restore if needed
    if (shouldSave) {
#if SKIA_DOM_DEBUG_VERBOSE
      printDebugInfo("canvas->restore()");
#endif
      context->getCanvas()->restore();
    }

    if (shouldRestore) {
      _paintCache.parent = parentPaint;
      _paintCache.child = context->getPaint();
      context->restore();
    }

#if SKIA_DOM_DEBUG
    printDebugInfo("End Render");
#endif
  }

  /**
   Override reset (last thing that happens in the render cycle) to also reset
   the changed flag on the local drawing context if necessary.
   */
  void resetPendingChanges() override { JsiDomNode::resetPendingChanges(); }

  /**
   Overridden dispose to release resources
   */
  void dispose(bool immediate) override {
    JsiDomNode::dispose(immediate);
    _paintCache.clear();
  }

protected:
  /**
   Invalidates and marks then context as changed.
   */
  void invalidateContext() override {
    enqueAsynOperation([weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        std::static_pointer_cast<JsiDomRenderNode>(self)->_paintCache.parent =
            nullptr;
        std::static_pointer_cast<JsiDomRenderNode>(self)->_paintCache.child =
            nullptr;
      }
    });
  }

  /**
   Override to implement rendering where the current state of the drawing
   context is correctly set.
   */
  virtual void renderNode(DrawingContext *context) = 0;

  /**
   Define common properties for all render nodes
   */
  void defineProperties(NodePropsContainer *container) override {
    JsiDomNode::defineProperties(container);

    _paintProps = container->defineProperty<PaintProps>();

    _matrixProp = container->defineProperty<MatrixProp>("matrix");
    _transformProp = container->defineProperty<TransformProp>("transform");
    _originProp = container->defineProperty<PointProp>("origin");
    _clipProp = container->defineProperty<ClipProp>("clip");
    _invertClip = container->defineProperty<NodeProp>("invertClip");
    _layerProp = container->defineProperty<LayerProp>("layer");
  }

  /**
   Validates that only declaration nodes can be children
   */
  void addChild(std::shared_ptr<JsiDomNode> child) override {
    JsiDomNode::addChild(child);
    _paintCache.parent = nullptr;
    _paintCache.child = nullptr;
  }

  /**
   Validates that only declaration nodes can be children
   */
  void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                         std::shared_ptr<JsiDomNode> before) override {
    JsiDomNode::insertChildBefore(child, before);
    _paintCache.parent = nullptr;
    _paintCache.child = nullptr;
  }

  /**
   A property changed
   */
  void onPropertyChanged(BaseNodeProp *prop) override {
    static std::vector<const char *> paintProps = {
        JsiPropId::get("color"),      JsiPropId::get("strokeWidth"),
        JsiPropId::get("blendMode"),  JsiPropId::get("strokeCap"),
        JsiPropId::get("strokeJoin"), JsiPropId::get("strokeMiter"),
        JsiPropId::get("style"),      JsiPropId::get("antiAlias"),
        JsiPropId::get("opacity")};

    // We'll invalidate paint if a prop change happened in a paint property
    if (std::find(paintProps.begin(), paintProps.end(), prop->getName()) !=
        paintProps.end()) {
      invalidateContext();
    }
  }

private:
  /**
   Clips the canvas depending on the clip property
   */
  void clip(DrawingContext *context, SkCanvas *canvas, bool invert) {
    auto op = invert ? SkClipOp::kDifference : SkClipOp::kIntersect;
    if (_clipProp->getRect() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipRect()");
#endif
      canvas->clipRect(*_clipProp->getRect(), op, true);
    } else if (_clipProp->getRRect() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipRRect()");
#endif
      canvas->clipRRect(*_clipProp->getRRect(), op, true);
    } else if (_clipProp->getPath() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipPath()");
#endif
      canvas->clipPath(*_clipProp->getPath(), op, true);
    }
  }

  struct PaintCache {
    void clear() {
      parent = nullptr;
      child = nullptr;
    }
    std::shared_ptr<SkPaint> parent;
    std::shared_ptr<SkPaint> child;
  };

  PaintCache _paintCache;

  PointProp *_originProp;
  MatrixProp *_matrixProp;
  TransformProp *_transformProp;
  NodeProp *_invertClip;
  ClipProp *_clipProp;
  LayerProp *_layerProp;
  PaintProps *_paintProps;
};

} // namespace RNSkia
