#pragma once

#include "JsiColorFilterNodes.h"
#include "JsiDomDeclarationNode.h"
#include "JsiShaderNodes.h"
#include "JsiSkRuntimeEffect.h"

#include "NodeProp.h"
#include "RadiusProp.h"
#include "TileModeProp.h"
#include "UniformsProp.h"

#include <memory>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkImageFilter.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

class JsiBaseImageFilterNode
    : public JsiDomDeclarationNode<JsiBaseImageFilterNode,
                                   sk_sp<SkImageFilter>> {
public:
  JsiBaseImageFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                         const char *type)
      : JsiDomDeclarationNode<JsiBaseImageFilterNode, sk_sp<SkImageFilter>>(
            context, type) {}

protected:
  sk_sp<SkImageFilter> resolve(std::shared_ptr<JsiDomNode> child) override {
    auto imageFilterPtr =
        std::dynamic_pointer_cast<JsiBaseImageFilterNode>(child);
    if (imageFilterPtr) {
      return imageFilterPtr->getCurrent();
    }
    auto shaderPtr = std::dynamic_pointer_cast<JsiBaseShaderNode>(child);
    if (shaderPtr) {
      return SkImageFilters::Shader(shaderPtr->getCurrent());
    }
    auto colorFilterPtr =
        std::dynamic_pointer_cast<JsiBaseColorFilterNode>(child);
    if (colorFilterPtr) {
      return SkImageFilters::ColorFilter(colorFilterPtr->getCurrent(), nullptr);
    }
    return nullptr;
  }

  void setImageFilter(DrawingContext *context, sk_sp<SkImageFilter> f) {
    set(context, f);
  }

  void set(DrawingContext *context, sk_sp<SkImageFilter> imageFilter) override {
    auto paint = context->getMutablePaint();
    if (paint->getImageFilter() != nullptr &&
        paint->getImageFilter() != getCurrent().get()) {
      paint->setImageFilter(
          SkImageFilters::Compose(paint->refImageFilter(), imageFilter));
    } else {
      paint->setImageFilter(imageFilter);
    }

    setCurrent(imageFilter);
  }
};

class JsiBlendImageFilterNode : public JsiBaseImageFilterNode,
                                public JsiDomNodeCtor<JsiBlendImageFilterNode> {
public:
  explicit JsiBlendImageFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skBlendImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {

    if (isChanged(context)) {

      if (getChildren().size() != 2) {
        throw std::runtime_error("Blend image filter needs two child nodes.");
      }

      auto background = requireChild(0);
      auto foreground = requireChild(1);

      SkBlendMode blendMode = *_blendModeProp->getDerivedValue();
      setImageFilter(context,
                     SkImageFilters::Blend(blendMode, background, foreground));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _blendModeProp = container->defineProperty<BlendModeProp>("mode");
    _blendModeProp->require();
  }

private:
  BlendModeProp *_blendModeProp;
};

class JsiDropShadowImageFilterNode
    : public JsiBaseImageFilterNode,
      public JsiDomNodeCtor<JsiDropShadowImageFilterNode> {
public:
  explicit JsiDropShadowImageFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skDropShadowImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto color = _colorProp->getDerivedValue();
      auto dx = _dxProp->value().getAsNumber();
      auto dy = _dxProp->value().getAsNumber();
      auto blur = _blurProp->value().getAsNumber();
      auto input = optionalChild(0);

      auto inner = _innerProp->isSet() && _innerProp->value().getAsBool();
      auto shadowOnly =
          _shadowOnlyProp->isSet() && _shadowOnlyProp->value().getAsBool();

      if (inner) {
        auto srcGraphic = SkImageFilters::ColorFilter(
            SkColorFilters::Blend(SK_ColorBLACK, SkBlendMode::kDst), nullptr);
        auto srcAlpha = SkImageFilters::ColorFilter(
            SkColorFilters::Blend(SK_ColorBLACK, SkBlendMode::kSrcIn), nullptr);
        auto f1 = SkImageFilters::ColorFilter(
            SkColorFilters::Blend(*color, SkBlendMode::kSrcOut), nullptr);
        auto f2 = SkImageFilters::Offset(dx, dy, f1);
        auto f3 = SkImageFilters::Blur(blur, blur, SkTileMode::kDecal, f2);
        auto f4 = SkImageFilters::Blend(SkBlendMode::kSrcIn, srcAlpha, f3);

        setImageFilter(context, SkImageFilters::Compose(
                                    input ? input : nullptr,
                                    SkImageFilters::Blend(SkBlendMode::kSrcOver,
                                                          srcGraphic, f4)));

      } else {
        setImageFilter(
            context,
            shadowOnly
                ? SkImageFilters::DropShadowOnly(dx, dy, blur, blur, *color,
                                                 input ? input : nullptr)
                : SkImageFilters::DropShadow(dx, dy, blur, blur, *color,
                                             input ? input : nullptr));
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _dxProp = container->defineProperty<NodeProp>("dx");
    _dyProp = container->defineProperty<NodeProp>("dy");
    _blurProp = container->defineProperty<NodeProp>("blur");
    _colorProp = container->defineProperty<ColorProp>("color");

    _innerProp = container->defineProperty<NodeProp>("inner");
    _shadowOnlyProp = container->defineProperty<NodeProp>("shadowOnly");

    _dxProp->require();
    _dyProp->require();
    _blurProp->require();
    _colorProp->require();
  }

private:
  NodeProp *_dxProp;
  NodeProp *_dyProp;
  NodeProp *_blurProp;
  ColorProp *_colorProp;
  NodeProp *_innerProp;
  NodeProp *_shadowOnlyProp;
};

class JsiDisplacementMapImageFilterNode
    : public JsiBaseImageFilterNode,
      public JsiDomNodeCtor<JsiDisplacementMapImageFilterNode> {
public:
  explicit JsiDisplacementMapImageFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skDisplacementMapImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {

      auto channelX =
          getColorChannelFromStringValue(_channelXProp->value().getAsString());
      auto channelY =
          getColorChannelFromStringValue(_channelYProp->value().getAsString());
      auto scale = _scaleProp->value().getAsNumber();

      auto displacement = requireChild(0);
      auto color = optionalChild(1);

      setImageFilter(context, SkImageFilters::DisplacementMap(
                                  channelX, channelY, scale, displacement,
                                  color ? color : nullptr));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _channelXProp = container->defineProperty<NodeProp>("channelX");
    _channelYProp = container->defineProperty<NodeProp>("channelY");
    _scaleProp = container->defineProperty<NodeProp>("scale");

    _channelXProp->require();
    _channelYProp->require();
    _scaleProp->require();
  }

private:
  SkColorChannel getColorChannelFromStringValue(const std::string &value) {
    if (value == "r") {
      return SkColorChannel::kR;
    } else if (value == "g") {
      return SkColorChannel::kG;
    } else if (value == "b") {
      return SkColorChannel::kB;
    } else if (value == "a") {
      return SkColorChannel::kA;
    }
    throw std::runtime_error("Value \"" + value +
                             "\" is not a valid color channel.");
  }

  NodeProp *_channelXProp;
  NodeProp *_channelYProp;
  NodeProp *_scaleProp;
};

class JsiBlurImageFilterNode : public JsiBaseImageFilterNode,
                               public JsiDomNodeCtor<JsiBlurImageFilterNode> {
public:
  explicit JsiBlurImageFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skBlurImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto input = optionalChild(0);
      setImageFilter(
          context, SkImageFilters::Blur(_blurProp->getDerivedValue()->x(),
                                        _blurProp->getDerivedValue()->y(),
                                        _tileModeProp->isSet()
                                            ? *_tileModeProp->getDerivedValue()
                                            : SkTileMode::kDecal,
                                        input ? input : nullptr));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _blurProp = container->defineProperty<RadiusProp>("blur");
    _tileModeProp = container->defineProperty<TileModeProp>("mode");

    _blurProp->require();
  }

private:
  RadiusProp *_blurProp;
  TileModeProp *_tileModeProp;
};

class JsiOffsetImageFilterNode
    : public JsiBaseImageFilterNode,
      public JsiDomNodeCtor<JsiOffsetImageFilterNode> {
public:
  explicit JsiOffsetImageFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skOffsetImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto input = optionalChild(0);
      if (getPropsContainer()->isChanged()) {
        setImageFilter(context,
                       SkImageFilters::Offset(_xProp->value().getAsNumber(),
                                              _yProp->value().getAsNumber(),
                                              input ? input : nullptr));
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _xProp = container->defineProperty<NodeProp>("x");
    _yProp = container->defineProperty<NodeProp>("y");

    _xProp->require();
    _yProp->require();
  }

private:
  NodeProp *_xProp;
  NodeProp *_yProp;
};

class JsiMorphologyImageFilterNode
    : public JsiBaseImageFilterNode,
      public JsiDomNodeCtor<JsiMorphologyImageFilterNode> {
public:
  enum Type { Dilate, Erode };

  explicit JsiMorphologyImageFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skMorphologyImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto op = getTypeFromStringValue(_operatorProp->value().getAsString());
      auto radius = _radiusProp->getDerivedValue();
      auto input = optionalChild(0);

      if (op == Type::Dilate) {
        setImageFilter(context,
                       SkImageFilters::Dilate(radius->x(), radius->y(),
                                              input ? input : nullptr));
      } else {
        setImageFilter(context, SkImageFilters::Erode(radius->x(), radius->y(),
                                                      input ? input : nullptr));
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _operatorProp = container->defineProperty<NodeProp>("operator");
    _radiusProp = container->defineProperty<RadiusProp>("radius");

    _operatorProp->require();
    _radiusProp->require();
  }

private:
  Type getTypeFromStringValue(const std::string &value) {
    if (value == "erode") {
      return Type::Erode;
    } else if (value == "dilate") {
      return Type::Dilate;
    }
    throw std::runtime_error("Value \"" + value +
                             "\" is not valid for the operator property in the "
                             "MorphologyImageFilter component.");
  }
  NodeProp *_operatorProp;
  RadiusProp *_radiusProp;
};

class JsiRuntimeShaderImageFilterNode
    : public JsiBaseImageFilterNode,
      public JsiDomNodeCtor<JsiRuntimeShaderImageFilterNode> {
public:
  explicit JsiRuntimeShaderImageFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseImageFilterNode(context, "skRuntimeShaderImageFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto source = _sourceProp->value().getAs<JsiSkRuntimeEffect>();
      if (source == nullptr) {
        throw std::runtime_error("Expected runtime effect when reading source "
                                 "property of RuntimeEffectImageFilter.");
      }

      auto builder = SkRuntimeShaderBuilder(source->getObject());
      auto input = optionalChild(0);
      _uniformsProp->processUniforms(builder);

      setImageFilter(context,
                     SkImageFilters::RuntimeShader(builder, "", input));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _sourceProp = container->defineProperty<NodeProp>("source");
    _uniformsProp =
        container->defineProperty<UniformsProp>("uniforms", _sourceProp);

    _sourceProp->require();
  }

private:
  NodeProp *_sourceProp;
  UniformsProp *_uniformsProp;
};

} // namespace ABI48_0_0RNSkia
