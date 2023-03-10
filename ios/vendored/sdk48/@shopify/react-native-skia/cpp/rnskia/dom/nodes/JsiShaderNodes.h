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

#include <SkShader.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

class JsiBaseShaderNode
    : public JsiDomDeclarationNode<JsiBaseShaderNode, sk_sp<SkShader>> {
public:
  JsiBaseShaderNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                    const char *type)
      : JsiDomDeclarationNode<JsiBaseShaderNode, sk_sp<SkShader>>(context,
                                                                  type) {}

protected:
  sk_sp<SkShader> resolve(std::shared_ptr<JsiDomNode> child) override {
    auto ptr = std::dynamic_pointer_cast<JsiBaseShaderNode>(child);
    if (ptr) {
      return ptr->getCurrent();
    }
    return nullptr;
  }

  void setShader(DrawingContext *context, sk_sp<SkShader> f) {
    set(context, f);
  }

  void set(DrawingContext *context, sk_sp<SkShader> shader) override {
    auto paint = context->getMutablePaint();
    paint->setShader(shader);
    setCurrent(shader);
  }
};

class JsiShaderNode : public JsiBaseShaderNode,
                      public JsiDomNodeCtor<JsiShaderNode> {
public:
  explicit JsiShaderNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseShaderNode(context, "skShader") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
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
      std::vector<sk_sp<SkShader>> children;
      children.reserve(getChildren().size());
      for (auto &child : getChildren()) {
        auto ptr = std::dynamic_pointer_cast<JsiBaseShaderNode>(child);
        if (ptr != nullptr) {
          children.push_back(ptr->getCurrent());
        }
      }

      // Update shader
      setShader(context, source->getObject()->makeShader(
                             uniforms, children.data(), children.size(), &lm));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
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

class JsiImageShaderNode : public JsiBaseShaderNode,
                           public JsiDomNodeCtor<JsiImageShaderNode> {
public:
  explicit JsiImageShaderNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseShaderNode(context, "skImageShader") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto image = _imageProps->getImage();
      auto rect = _imageProps->getRect();
      auto lm =
          _transformProp->isSet() ? _transformProp->getDerivedValue() : nullptr;

      if (rect != nullptr && lm != nullptr) {
        auto rc = _imageProps->getDerivedValue();
        auto m3 = _imageProps->rect2rect(rc->src, rc->dst);
        if (_transformProp->isChanged()) {
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

      setShader(
          context,
          image->makeShader(
              *_txProp->getDerivedValue(), *_tyProp->getDerivedValue(),
              SkSamplingOptions(getFilterModeFromString(
                                    _filterModeProp->value().getAsString()),
                                getMipmapModeFromString(
                                    _mipmapModeProp->value().getAsString())),
              &_matrix));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
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
    container->defineProperty<NodeProp>("image")->require();
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

class JsiColorShaderNode : public JsiBaseShaderNode,
                           public JsiDomNodeCtor<JsiColorShaderNode> {
public:
  explicit JsiColorShaderNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseShaderNode(context, "skColorShader") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      if (_colorProp->isSet()) {
        setShader(context, SkShaders::Color(*_colorProp->getDerivedValue()));
      } else {
        setShader(context, nullptr);
      }
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _colorProp = container->defineProperty<ColorProp>("color");
    _colorProp->require();
  }

private:
  ColorProp *_colorProp;
};

class JsiBasePerlinNoiseNode : public JsiBaseShaderNode {
public:
  JsiBasePerlinNoiseNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                         PropId type)
      : JsiBaseShaderNode(context, type) {}

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
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
  explicit JsiTurbulenceNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBasePerlinNoiseNode(context, "skTurbulence") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      SkISize size = SkISize::Make(_tileWidthProp->value().getAsNumber(),
                                   _tileHeightProp->value().getAsNumber());

      setShader(context, SkPerlinNoiseShader::MakeTurbulence(
                             _freqXProp->value().getAsNumber(),
                             _freqYProp->value().getAsNumber(),
                             _octavesProp->value().getAsNumber(),
                             _seedProp->value().getAsNumber(), &size));
    }
  }
};

class JsiFractalNoiseNode : public JsiBasePerlinNoiseNode,
                            public JsiDomNodeCtor<JsiFractalNoiseNode> {
public:
  explicit JsiFractalNoiseNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBasePerlinNoiseNode(context, "skFractalNoise") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      SkISize size = SkISize::Make(_tileWidthProp->value().getAsNumber(),
                                   _tileHeightProp->value().getAsNumber());

      setShader(context, SkPerlinNoiseShader::MakeFractalNoise(
                             _freqXProp->value().getAsNumber(),
                             _freqYProp->value().getAsNumber(),
                             _octavesProp->value().getAsNumber(),
                             _seedProp->value().getAsNumber(), &size));
    }
  }
};

class JsiBaseGradientNode : public JsiBaseShaderNode {
public:
  JsiBaseGradientNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context, PropId type)
      : JsiBaseShaderNode(context, type) {}

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _transformsProps = container->defineProperty<TransformsProps>();

    _colorsProp = container->defineProperty<ColorsProp>("colors");
    _positionsProp = container->defineProperty<NumbersProp>("positions");
    _modeProp = container->defineProperty<TileModeProp>("mode");
    _flagsProp = container->defineProperty<NodeProp>("flags");

    _colorsProp->require();
  }

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      _colors = _colorsProp->getDerivedValue()->data();
      _colorCount = static_cast<int>(_colorsProp->getDerivedValue()->size());
      _flags = _flagsProp->isSet() ? _flagsProp->value().getAsNumber() : 0;
      _mode = _modeProp->isSet() ? *_modeProp->getDerivedValue()
                                 : SkTileMode::kClamp;
      _positions = _positionsProp->isSet()
                       ? _positionsProp->getDerivedValue()->data()
                       : nullptr;
      _matrix = _transformsProps->isSet()
                    ? _transformsProps->getDerivedValue().get()
                    : nullptr;
    }
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
  explicit JsiLinearGradientNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skLinearGradient") {}

protected:
  void decorate(DrawingContext *context) override {
    JsiBaseGradientNode::decorate(context);

    if (isChanged(context)) {
      SkPoint pts[] = {*_startProp->getDerivedValue(),
                       *_endProp->getDerivedValue()};
      setShader(context, SkGradientShader::MakeLinear(pts, _colors, _positions,
                                                      _colorCount, _mode,
                                                      _flags, _matrix));
    }
  }

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
  explicit JsiRadialGradientNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skRadialGradient") {}

protected:
  void decorate(DrawingContext *context) override {
    JsiBaseGradientNode::decorate(context);

    if (isChanged(context)) {
      auto c = _centerProp->getDerivedValue();
      auto r = _radiusProp->value().getAsNumber();
      setShader(context, SkGradientShader::MakeRadial(*c, r, _colors,
                                                      _positions, _colorCount,
                                                      _mode, _flags, _matrix));
    }
  }

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
  explicit JsiSweepGradientNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skSweepGradient") {}

protected:
  void decorate(DrawingContext *context) override {
    JsiBaseGradientNode::decorate(context);

    if (isChanged(context)) {
      auto start = _startProp->isSet() ? _startProp->value().getAsNumber() : 0;
      auto end = _endProp->isSet() ? _endProp->value().getAsNumber() : 360;
      auto c = _centerProp->getDerivedValue();

      setShader(context, SkGradientShader::MakeSweep(
                             c->x(), c->y(), _colors, _positions, _colorCount,
                             _mode, start, end, _flags, _matrix));
    }
  }

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
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseGradientNode(context, "skTwoPointConicalGradient") {}

protected:
  void decorate(DrawingContext *context) override {
    JsiBaseGradientNode::decorate(context);

    if (isChanged(context)) {
      auto start = _startProp->getDerivedValue();
      auto end = _endProp->getDerivedValue();
      auto startR = _startRProp->value().getAsNumber();
      auto endR = _endRProp->value().getAsNumber();

      setShader(context, SkGradientShader::MakeTwoPointConical(
                             *start, startR, *end, endR, _colors, _positions,
                             _colorCount, _mode, _flags, _matrix));
    }
  }

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

} // namespace ABI48_0_0RNSkia
