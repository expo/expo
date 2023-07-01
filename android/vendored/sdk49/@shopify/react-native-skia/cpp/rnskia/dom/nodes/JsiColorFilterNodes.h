#pragma once

#include "JsiDomDeclarationNode.h"

#include "BlendModeProp.h"
#include "ColorProp.h"
#include "NodeProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

class JsiBaseColorFilterNode : public JsiDomDeclarationNode {
public:
  JsiBaseColorFilterNode(std::shared_ptr<RNSkPlatformContext> context,
                         const char *type)
      : JsiDomDeclarationNode(context, type, DeclarationType::ColorFilter) {}

protected:
  void composeAndPush(DeclarationContext *context, sk_sp<SkColorFilter> cf1) {
    context->save();
    decorateChildren(context);
    auto cf2 = context->getColorFilters()->popAsOne();
    context->restore();
    auto cf = cf2 ? SkColorFilters::Compose(cf1, cf2) : cf1;
    context->getColorFilters()->push(cf);
  }
};

class JsiMatrixColorFilterNode
    : public JsiBaseColorFilterNode,
      public JsiDomNodeCtor<JsiMatrixColorFilterNode> {
public:
  explicit JsiMatrixColorFilterNode(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skMatrixColorFilter") {}

  void decorate(DeclarationContext *context) override {
    auto array = _matrixProp->value().getAsArray();
    float matrix[20];
    for (int i = 0; i < 20; i++) {
      if (array.size() > i) {
        matrix[i] = array[i].getAsNumber();
      }
    }
    composeAndPush(context, SkColorFilters::Matrix(matrix));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _matrixProp = container->defineProperty<NodeProp>("matrix");
    _matrixProp->require();
  }

private:
  NodeProp *_matrixProp;
};

class JsiBlendColorFilterNode : public JsiBaseColorFilterNode,
                                public JsiDomNodeCtor<JsiBlendColorFilterNode> {
public:
  explicit JsiBlendColorFilterNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skBlendColorFilter") {}

  void decorate(DeclarationContext *context) override {
    auto color = _colorProp->getDerivedValue();
    auto mode = _blendModeProp->getDerivedValue();
    composeAndPush(context, SkColorFilters::Blend(*color, *mode));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _blendModeProp = container->defineProperty<BlendModeProp>("mode");
    _colorProp = container->defineProperty<ColorProp>("color");

    _blendModeProp->require();
    _colorProp->require();
  }

private:
  BlendModeProp *_blendModeProp;
  ColorProp *_colorProp;
};

class JsiLinearToSRGBGammaColorFilterNode
    : public JsiBaseColorFilterNode,
      public JsiDomNodeCtor<JsiLinearToSRGBGammaColorFilterNode> {
public:
  explicit JsiLinearToSRGBGammaColorFilterNode(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLinearToSRGBGammaColorFilter") {}

  void decorate(DeclarationContext *context) override {
    composeAndPush(context, SkColorFilters::LinearToSRGBGamma());
  }
};

class JsiSRGBToLinearGammaColorFilterNode
    : public JsiBaseColorFilterNode,
      public JsiDomNodeCtor<JsiSRGBToLinearGammaColorFilterNode> {
public:
  explicit JsiSRGBToLinearGammaColorFilterNode(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skSRGBToLinearGammaColorFilter") {}

  void decorate(DeclarationContext *context) override {
    composeAndPush(context, SkColorFilters::SRGBToLinearGamma());
  }
};

class JsiLumaColorFilterNode : public JsiBaseColorFilterNode,
                               public JsiDomNodeCtor<JsiLumaColorFilterNode> {
public:
  explicit JsiLumaColorFilterNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLumaColorFilter") {}

  void decorate(DeclarationContext *context) override {
    composeAndPush(context, SkLumaColorFilter::Make());
  }
};

class JsiLerpColorFilterNode : public JsiBaseColorFilterNode,
                               public JsiDomNodeCtor<JsiLerpColorFilterNode> {
public:
  explicit JsiLerpColorFilterNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLerpColorFilter") {}

  void decorate(DeclarationContext *context) override {
    context->save();
    decorateChildren(context);
    auto second = context->getColorFilters()->pop();
    auto first = context->getColorFilters()->pop();
    context->restore();

    if (first == nullptr || second == nullptr) {
      throw std::runtime_error(
          "LerpColorFilterNode: missing two color filters as children");
    }

    auto t = _tProp->value().getAsNumber();
    context->getColorFilters()->push(SkColorFilters::Lerp(t, first, second));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _tProp = container->defineProperty<NodeProp>("t");
    _tProp->require();
  }

private:
  NodeProp *_tProp;
};

} // namespace RNSkia
