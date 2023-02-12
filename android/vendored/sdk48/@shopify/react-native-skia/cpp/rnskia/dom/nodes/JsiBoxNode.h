#pragma once

#include "JsiBoxShadowNode.h"
#include "JsiDomRenderNode.h"

#include <memory>
#include <vector>

namespace RNSkia {

class JsiBoxNode : public JsiDomRenderNode, public JsiDomNodeCtor<JsiBoxNode> {
public:
  explicit JsiBoxNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomRenderNode(context, "skBox") {}

protected:
  void renderNode(DrawingContext *context) override {
    // Get rect - we'll try to end up with an rrect:
    auto box = *_boxProp->getDerivedValue();

    // Get shadows
    std::vector<std::shared_ptr<JsiBoxShadowNode>> shadows;
    for (auto &child : getChildren()) {
      auto shadowNode = std::dynamic_pointer_cast<JsiBoxShadowNode>(child);
      if (shadowNode != nullptr && shadowNode->getBoxShadowProps()->isSet()) {
        shadows.push_back(shadowNode);
      }
    }
    // Render outer shadows
    for (auto &shadow : shadows) {
      if (!shadow->getBoxShadowProps()->isInner()) {
        // Now let's render
        auto dx = shadow->getBoxShadowProps()->getDx();
        auto dy = shadow->getBoxShadowProps()->getDy();
        auto spread = shadow->getBoxShadowProps()->getSpread();

        context->getCanvas()->drawRRect(
            inflate(box, spread, spread, dx, dy),
            *shadow->getBoxShadowProps()->getDerivedValue());
      }
    }

    // Render box
    context->getCanvas()->drawRRect(box, *context->getPaint());

    // Render inner shadows
    for (auto &shadow : shadows) {
      if (shadow->getBoxShadowProps()->isInner()) {
        // Now let's render
        auto dx = shadow->getBoxShadowProps()->getDx();
        auto dy = shadow->getBoxShadowProps()->getDy();
        auto spread = shadow->getBoxShadowProps()->getSpread();
        auto delta = SkPoint::Make(10 + std::abs(dx), 10 + std::abs(dy));

        context->getCanvas()->save();
        context->getCanvas()->clipRRect(box, SkClipOp::kIntersect, false);

        auto inner = deflate(box, spread, spread, dx, dy);
        auto outer = inflate(box, delta.x(), delta.y());

        // Render!
        context->getCanvas()->drawDRRect(
            outer, inner, *shadow->getBoxShadowProps()->getDerivedValue());

        context->getCanvas()->restore();
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomRenderNode::defineProperties(container);
    _boxProp = container->defineProperty<BoxProps>("box");
    _boxProp->require();
  }

private:
  SkRRect inflate(const SkRRect &box, SkScalar dx, SkScalar dy, SkScalar tx = 0,
                  SkScalar ty = 0) {
    return SkRRect::MakeRectXY(
        SkRect::MakeXYWH(box.rect().x() - dx + tx, box.rect().y() - dy + ty,
                         box.rect().width() + 2 * dx,
                         box.rect().height() + 2 * dy),
        box.getSimpleRadii().x() + dx, box.getSimpleRadii().y() + dy);
  }

  SkRRect deflate(const SkRRect &box, SkScalar dx, SkScalar dy, SkScalar tx = 0,
                  SkScalar ty = 0) {
    return inflate(box, -dx, -dy, tx, ty);
  }

  BoxProps *_boxProp;
};

} // namespace RNSkia
