#pragma once

#include "JsiDomDeclarationNode.h"

#include "NodeProp.h"

#include <memory>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkMaskFilter.h>

#pragma clang diagnostic pop

namespace RNSkia {

class JsiBlurMaskNode : public JsiBaseDomDeclarationNode,
                        public JsiDomNodeCtor<JsiBlurMaskNode> {
public:
  explicit JsiBlurMaskNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseDomDeclarationNode(context, "skBlurMaskFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (context->isChanged() || getPropsContainer()->isChanged()) {

      bool respectCTM =
          _respectCTM->isSet() ? _respectCTM->value().getAsBool() : true;
      SkBlurStyle style = SkBlurStyle::kNormal_SkBlurStyle;
      if (_style->isSet()) {
        style = getBlurStyleFromString(_style->value().getAsString());
      }

      auto filter = SkMaskFilter::MakeBlur(style, _blur->value().getAsNumber(),
                                           respectCTM);

      // Set the mask filter
      context->getMutablePaint()->setMaskFilter(filter);
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);

    _style = container->defineProperty<NodeProp>("style");
    _respectCTM = container->defineProperty<NodeProp>("respectCTM");
    _blur = container->defineProperty<NodeProp>("blur");

    _blur->require();
  }

private:
  SkBlurStyle getBlurStyleFromString(const std::string &value) {
    if (value == "normal") {
      return SkBlurStyle::kNormal_SkBlurStyle;
    } else if (value == "solid") {
      return SkBlurStyle::kSolid_SkBlurStyle;
    } else if (value == "outer") {
      return SkBlurStyle::kOuter_SkBlurStyle;
    } else if (value == "inner") {
      return SkBlurStyle::kInner_SkBlurStyle;
    }
    getContext()->raiseError(std::runtime_error(
        "The value \"" + value + "\" is not " + "a valid blur style."));
    return SkBlurStyle::kNormal_SkBlurStyle;
  }

  NodeProp *_style;
  NodeProp *_respectCTM;
  NodeProp *_blur;
};

} // namespace RNSkia
