#pragma once

#include "JsiDomDeclarationNode.h"

#include <memory>
#include <string>

namespace RNSkia {

class JsiBlendNode : public JsiBaseDomDeclarationNode,
                     public JsiDomNodeCtor<JsiBlendNode> {
public:
  explicit JsiBlendNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseDomDeclarationNode(context, "skBlend") {}

protected:
  void decorate(DrawingContext *context) override {
    if (context->isChanged() || getPropsContainer()->isChanged()) {
      auto children = getChildren();
      auto childSize = children.size();

      // No need to do anything if there are no children here
      if (childSize == 0) {
        return;
      }

      // Blend mode
      auto blendMode = *_blendProp->getDerivedValue();

      // Find the latest child and check if it is a shader or image filter
      bool asShader = std::dynamic_pointer_cast<JsiBaseShaderNode>(
                          children.at(childSize - 1)) != nullptr;

      // Traverse children in reverse
      sk_sp<SkShader> innerShader;
      sk_sp<SkImageFilter> innerImageFilter;

      for (size_t i = childSize - 1; i != (std::size_t)-1; i--) {
        auto child = children.at(i);
        auto maybeShader = std::dynamic_pointer_cast<JsiBaseShaderNode>(child);
        auto maybeImageFilter =
            std::dynamic_pointer_cast<JsiBaseImageFilterNode>(child);

        if (maybeShader) {
          sk_sp<SkShader> outer = maybeShader->getCurrent();
          if (innerShader != nullptr) {
            innerShader = SkShaders::Blend(blendMode, outer, innerShader);
          } else {
            innerShader = outer;
          }
        } else if (maybeImageFilter) {
          sk_sp<SkImageFilter> outer = maybeImageFilter->getCurrent();
          if (outer != nullptr) {
            innerImageFilter = SkImageFilters::Blend(blendMode, outer,
                                                     innerImageFilter, nullptr);
          } else {
            innerImageFilter = outer;
          }
        }
      }

      // Materialize
      if (asShader) {
        context->getMutablePaint()->setShader(innerShader);
      } else {
        context->getMutablePaint()->setImageFilter(innerImageFilter);
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _blendProp = container->defineProperty<BlendModeProp>("mode");
    _blendProp->require();
  }

  /**
   Validates that only declaration nodes can be children
   */
  void addChild(std::shared_ptr<JsiDomNode> child) override {
    JsiBaseDomDeclarationNode::addChild(child);
    // Verify declaration of either shader or image filter
    verifyChild(child);
  }

  /**
   Validates that only declaration nodes can be children
   */
  void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                         std::shared_ptr<JsiDomNode> before) override {
    JsiBaseDomDeclarationNode::insertChildBefore(child, before);
    // Verify declaration of either shader or image filter
    verifyChild(child);
  }

private:
  void verifyChild(std::shared_ptr<JsiDomNode> child) {
    if (std::dynamic_pointer_cast<JsiBaseShaderNode>(child) == nullptr &&
        std::dynamic_pointer_cast<JsiBaseImageFilterNode>(child) == nullptr) {
      // We'll raise an error when other children are added.
      std::runtime_error("Blend nodes only supports either shaders or image "
                         "filters as children, got " +
                         std::string(child->getType()) + ".");
    }
  }

  BlendModeProp *_blendProp;
};

} // namespace RNSkia
