#pragma once

#include "JsiDomDrawingNode.h"

#include "FontProp.h"
#include "GlyphsProp.h"

#include <memory>

namespace RNSkia {

class JsiGlyphsNode : public JsiDomDrawingNode,
                      public JsiDomNodeCtor<JsiGlyphsNode> {
public:
  explicit JsiGlyphsNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skGlyphs") {}

protected:
  void draw(DrawingContext *context) override {
    auto x = _xProp->value().getAsNumber();
    auto y = _yProp->value().getAsNumber();
    auto font = _fontProp->getDerivedValue();
    if (font != nullptr) {
      auto glyphInfo = _glyphsProp->getDerivedValue();

      context->getCanvas()->drawGlyphs(
          static_cast<int>(glyphInfo->glyphIds.size()),
          glyphInfo->glyphIds.data(), glyphInfo->positions.data(),
          SkPoint::Make(x, y), *font, *context->getPaint());
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);

    _fontProp = container->defineProperty<FontProp>("font");
    _glyphsProp = container->defineProperty<GlyphsProp>("glyphs");
    _xProp = container->defineProperty<NodeProp>("x");
    _yProp = container->defineProperty<NodeProp>("y");

    _glyphsProp->require();
    _xProp->require();
    _yProp->require();
  }

private:
  FontProp *_fontProp;
  GlyphsProp *_glyphsProp;
  NodeProp *_xProp;
  NodeProp *_yProp;
};

} // namespace RNSkia
