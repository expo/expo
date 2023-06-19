#pragma once

#include "JsiDomDeclarationNode.h"

#include "BlendModeProp.h"
#include "ColorProp.h"
#include "NodeProp.h"
#include "NumbersProp.h"
#include "TileModeProp.h"
#include "TransformsProps.h"
#include "UniformsProp.h"

#include <memory>
#include <string>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkShader.h"

#pragma clang diagnostic pop

namespace RNSkia {

class JsiShaderNode : public JsiDomDeclarationNode,
                      public JsiDomNodeCtor<JsiShaderNode> {
public:
  explicit JsiShaderNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skShader", DeclarationType::Shader) {}

  void decorate(DeclarationContext *context) override {
    decorateChildren(context);
    auto source = _sourceProp->value().getAs<JsiSkRuntimeEffect>();
    if (source == nullptr) {
      throw std::runtime_error("Expected runtime effect when reading source "
                               "property of RuntimeEffectImageFilter.");
    }
    auto uniforms =
        _uniformsProp->isSet() ? _uniformsProp->getDerivedValue() : nullptr;

    SkMatrix lm;
    auto tm =
        _transformProp->isSet() ? _transformProp->getDerivedValue() : nullptr;

    if (tm != nullptr) {
      if (_originProp->isSet()) {
        auto tr = _originProp->getDerivedValue();
        lm.preTranslate(tr->x(), tr->y());
        lm.preConcat(*tm);
        lm.preTranslate(-tr->x(), -tr->y());
      } else {
        lm.preConcat(*tm);
      }
    }

    // get all children that are shader nodes
    auto children = context->getShaders()->popAll();

    // Update shader
    context->getShaders()->push(source->getObject()->makeShader(
        uniforms, children.data(), children.size(), &lm));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _sourceProp = container->defineProperty<NodeProp>("source");
    _uniformsProp =
        container->defineProperty<UniformsProp>("uniforms", _sourceProp);
    _transformProp = container->defineProperty<TransformProp>("transform");
    _originProp = container->defineProperty<PointProp>("origin");

    _sourceProp->require();
  }

private:
  NodeProp *_sourceProp;
  UniformsProp *_uniformsProp;
  TransformProp *_transformProp;
  PointProp *_originProp;
};

class JsiImageShaderNode : public JsiDomDeclarationNode,
                           public JsiDomNodeCtor<JsiImageShaderNode> {
public:
  explicit JsiImageShaderNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skImageShader",
                              DeclarationType::Shader) {}

  void decorate(DeclarationContext *context) override {

    auto image = _imageProps->getImage();
    if (image == nullptr) {
      return;
    }

    auto rect = _imageProps->getRect();
    auto lm =
        _transformProp->isSet() ? _transformProp->getDerivedValue() : nullptr;

    if (rect != nullptr && lm != nullptr) {
      auto rc = _imageProps->getDerivedValue();
      auto m3 = _imageProps->rect2rect(rc->src, rc->dst);
      if (_transformProp->isChanged() || _imageProps->isChanged()) {
        // To modify the matrix we need to copy it since we're not allowed to
        // modify values contained in properties - this would have caused the
        // matrix to be translated and scaled more and more for each render
        // even thought the matrix prop did not change.
        _matrix.reset();
        _matrix.preConcat(m3);
        if (_originProp->isSet()) {
          auto tr = _originProp->getDerivedValue();
          _matrix.preTranslate(tr->x(), tr->y());
          _matrix.preConcat(*lm);
          _matrix.preTranslate(-tr->x(), -tr->y());
        } else {
          _matrix.preConcat(*lm);
        }
      }
    }

    context->getShaders()->push(image->makeShader(
        *_txProp->getDerivedValue(), *_tyProp->getDerivedValue(),
        SkSamplingOptions(
            getFilterModeFromString(_filterModeProp->value().getAsString()),
            getMipmapModeFromString(_mipmapModeProp->value().getAsString())),
        &_matrix));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _txProp = container->defineProperty<TileModeProp>("tx");
    _tyProp = container->defineProperty<TileModeProp>("ty");
    _filterModeProp = container->defineProperty<NodeProp>("fm");
    _mipmapModeProp = container->defineProperty<NodeProp>("mm");

    _imageProps = container->defineProperty<ImageProps>();
    _transformProp = container->defineProperty<TransformProp>("transform");
    _originProp = container->defineProperty<PointProp>("origin");

    _txProp->require();
    _tyProp->require();
    _filterModeProp->require();
    _mipmapModeProp->require();

    _transformProp->require();

    // Add and require the image
    container->defineProperty<NodeProp>("image");
  }

private:
  SkFilterMode getFilterModeFromString(const std::string &value) {
    if (value == "last") {
      return SkFilterMode::kLast;
    } else if (value == "linear") {
      return SkFilterMode::kLinear;
    } else if (value == "nearest") {
      return SkFilterMode::kNearest;
    }
    throw std::runtime_error("The value \"" + value +
                             "\" is not a valid Filter Mode.");
  }

  SkMipmapMode getMipmapModeFromString(const std::string &value) {
    if (value == "last") {
      return SkMipmapMode::kLast;
    } else if (value == "last") {
      return SkMipmapMode::kLast;
    } else if (value == "last") {
      return SkMipmapMode::kLast;
    } else if (value == "none") {
      return SkMipmapMode::kNone;
    }
    throw std::runtime_error("The value \"" + value +
                             "\" is not a valid Mipmap Mode.");
  }

  SkMatrix _matrix;

  TileModeProp *_txProp;
  TileModeProp *_tyProp;
  NodeProp *_filterModeProp;
  NodeProp *_mipmapModeProp;
  ImageProps *_imageProps;
  TransformProp *_transformProp;
  PointProp *_originProp;
};

class JsiColorShaderNode : public JsiDomDeclarationNode,
                           public JsiDomNodeCtor<JsiColorShaderNode> {
public:
  explicit JsiColorShaderNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skColorShader",
                              DeclarationType::Shader) {}

  void decorate(DeclarationContext *context) override {
    if (_colorProp->isSet()) {
      context->getShaders()->push(
          SkShaders::Color(*_colorProp->getDerivedValue()));
    }
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _colorProp = container->defineProperty<ColorProp>("color");
    _colorProp->require();
  }

private:
  ColorProp *_colorProp;
};

class JsiBasePerlinNoiseNode : public JsiDomDeclarationNode {
public:
  JsiBasePerlinNoiseNode(std::shared_ptr<RNSkPlatformContext> context,
                         PropId type)
      : JsiDomDeclarationNode(context, type, DeclarationType::Shader) {}

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _freqXProp = container->defineProperty<NodeProp>("freqX");
    _freqYProp = container->defineProperty<NodeProp>("freqY");
    _octavesProp = container->defineProperty<NodeProp>("octaves");
    _seedProp = container->defineProperty<NodeProp>("seed");
    _tileWidthProp = container->defineProperty<NodeProp>("tileWidth");
    _tileHeightProp = container->defineProperty<NodeProp>("tileHeight");

    _freqXProp->require();
    _freqYProp->require();
    _octavesProp->require();
    _seedProp->require();
    _tileWidthProp->require();
    _tileHeightProp->require();
  }

  NodeProp *_freqXProp;
  NodeProp *_freqYProp;
  NodeProp *_octavesProp;
  NodeProp *_seedProp;
  NodeProp *_tileWidthProp;
  NodeProp *_tileHeightProp;
};

class JsiTurbulenceNode : public JsiBasePerlinNoiseNode,
                          public JsiDomNodeCtor<JsiTurbulenceNode> {
public:
  explicit JsiTurbulenceNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePerlinNoiseNode(context, "skTurbulence") {}

  void decorate(DeclarationContext *context) override {

    SkISize size = SkISize::Make(_tileWidthProp->value().getAsNumber(),
                                 _tileHeightProp->value().getAsNumber());

    context->getShaders()->push(SkPerlinNoiseShader::MakeTurbulence(
        _freqXProp->value().getAsNumber(), _freqYProp->value().getAsNumber(),
        _octavesProp->value().getAsNumber(), _seedProp->value().getAsNumber(),
        &size));
  }
};

class JsiFractalNoiseNode : public JsiBasePerlinNoiseNode,
                            public JsiDomNodeCtor<JsiFractalNoiseNode> {
public:
  explicit JsiFractalNoiseNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePerlinNoiseNode(context, "skFractalNoise") {}

  void decorate(DeclarationContext *context) override {

    SkISize size = SkISize::Make(_tileWidthProp->value().getAsNumber(),
                                 _tileHeightProp->value().getAsNumber());

    context->getShaders()->push(SkPerlinNoiseShader::MakeFractalNoise(
        _freqXProp->value().getAsNumber(), _freqYProp->value().getAsNumber(),
        _octavesProp->value().getAsNumber(), _seedProp->value().getAsNumber(),
        &size));
  }
};

class JsiBaseGradientNode : public JsiDomDeclarationNode {
public:
  JsiBaseGradientNode(std::shared_ptr<RNSkPlatformContext> context, PropId type)
      : JsiDomDeclarationNode(context, type, DeclarationType::Shader) {}

  void decorate(DeclarationContext *context) override {

    _colors = _colorsProp->getDerivedValue()->data();
    _colorCount = static_cast<int>(_colorsProp->getDerivedValue()->size());
    _flags = _flagsProp->isSet() ? _flagsProp->value().getAsNumber() : 0;
    _mode =
        _modeProp->isSet() ? *_modeProp->getDerivedValue() : SkTileMode::kClamp;
    _positions = _positionsProp->isSet()
                     ? _positionsProp->getDerivedValue()->data()
                     : nullptr;
    _matrix = _transformsProps->isSet()
                  ? _transformsProps->getDerivedValue().get()
                  : nullptr;
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _transformsProps = container->defineProperty<TransformsProps>();

    _colorsProp = container->defineProperty<ColorsProp>("colors");
    _positionsProp = container->defineProperty<NumbersProp>("positions");
    _modeProp = container->defineProperty<TileModeProp>("mode");
    _flagsProp = container->defineProperty<NodeProp>("flags");

    _colorsProp->require();
  }

  const SkColor *_colors;
  double _flags;
  int _colorCount;
  SkTileMode _mode;
  const SkScalar *_positions;
  const SkMatrix *_matrix;

private:
  TransformsProps *_transformsProps;
  ColorsProp *_colorsProp;
  NumbersProp *_positionsProp;
  TileModeProp *_modeProp;
  NodeProp *_flagsProp;
};

class JsiLinearGradientNode : public JsiBaseGradientNode,
                              public JsiDomNodeCtor<JsiLinearGradientNode> {
public:
  explicit JsiLinearGradientNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skLinearGradient") {}

  void decorate(DeclarationContext *context) override {
    JsiBaseGradientNode::decorate(context);

    SkPoint pts[] = {*_startProp->getDerivedValue(),
                     *_endProp->getDerivedValue()};
    auto shader = SkGradientShader::MakeLinear(
        pts, _colors, _positions, _colorCount, _mode, _flags, _matrix);
    context->getShaders()->push(shader);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiBaseGradientNode::defineProperties(container);
    _startProp = container->defineProperty<PointProp>("start");
    _endProp = container->defineProperty<PointProp>("end");

    _startProp->require();
    _endProp->require();
  }

private:
  PointProp *_startProp;
  PointProp *_endProp;
};

class JsiRadialGradientNode : public JsiBaseGradientNode,
                              public JsiDomNodeCtor<JsiRadialGradientNode> {
public:
  explicit JsiRadialGradientNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skRadialGradient") {}

  void decorate(DeclarationContext *context) override {
    JsiBaseGradientNode::decorate(context);

    auto c = _centerProp->getDerivedValue();
    auto r = _radiusProp->value().getAsNumber();
    auto shader = SkGradientShader::MakeRadial(
        *c, r, _colors, _positions, _colorCount, _mode, _flags, _matrix);
    context->getShaders()->push(shader);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiBaseGradientNode::defineProperties(container);
    _centerProp = container->defineProperty<PointProp>("c");
    _radiusProp = container->defineProperty<NodeProp>("r");

    _centerProp->require();
    _radiusProp->require();
  }

private:
  PointProp *_centerProp;
  NodeProp *_radiusProp;
};

class JsiSweepGradientNode : public JsiBaseGradientNode,
                             public JsiDomNodeCtor<JsiSweepGradientNode> {
public:
  explicit JsiSweepGradientNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skSweepGradient") {}

  void decorate(DeclarationContext *context) override {
    JsiBaseGradientNode::decorate(context);

    auto start = _startProp->isSet() ? _startProp->value().getAsNumber() : 0;
    auto end = _endProp->isSet() ? _endProp->value().getAsNumber() : 360;
    auto c = _centerProp->getDerivedValue();

    context->getShaders()->push(SkGradientShader::MakeSweep(
        c->x(), c->y(), _colors, _positions, _colorCount, _mode, start, end,
        _flags, _matrix));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiBaseGradientNode::defineProperties(container);
    _startProp = container->defineProperty<NodeProp>("start");
    _endProp = container->defineProperty<NodeProp>("end");
    _centerProp = container->defineProperty<PointProp>("c");
  }

private:
  PointProp *_centerProp;
  NodeProp *_startProp;
  NodeProp *_endProp;
};

class JsiTwoPointConicalGradientNode
    : public JsiBaseGradientNode,
      public JsiDomNodeCtor<JsiTwoPointConicalGradientNode> {
public:
  explicit JsiTwoPointConicalGradientNode(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skTwoPointConicalGradient") {}

  void decorate(DeclarationContext *context) override {
    JsiBaseGradientNode::decorate(context);

    auto start = _startProp->getDerivedValue();
    auto end = _endProp->getDerivedValue();
    auto startR = _startRProp->value().getAsNumber();
    auto endR = _endRProp->value().getAsNumber();

    context->getShaders()->push(SkGradientShader::MakeTwoPointConical(
        *start, startR, *end, endR, _colors, _positions, _colorCount, _mode,
        _flags, _matrix));
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiBaseGradientNode::defineProperties(container);
    _startProp = container->defineProperty<PointProp>("start");
    _startRProp = container->defineProperty<NodeProp>("startR");
    _endProp = container->defineProperty<PointProp>("end");
    _endRProp = container->defineProperty<NodeProp>("endR");
  }

private:
  PointProp *_startProp;
  NodeProp *_startRProp;
  PointProp *_endProp;
  NodeProp *_endRProp;
};

} // namespace RNSkia
