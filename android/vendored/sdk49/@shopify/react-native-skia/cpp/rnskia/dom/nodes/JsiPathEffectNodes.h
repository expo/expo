#pragma once

#include "JsiDomDeclarationNode.h"

#include "NodeProp.h"

#include <memory>
#include <string>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPathEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

class JsiBasePathEffectNode : public JsiDomDeclarationNode {
public:
  JsiBasePathEffectNode(std::shared_ptr<RNSkPlatformContext> context,
                        const char *type)
      : JsiDomDeclarationNode(context, type, DeclarationType::PathEffect) {}

protected:
  void composeAndPush(DeclarationContext *context, sk_sp<SkPathEffect> pe1) {
    context->save();
    decorateChildren(context);
    auto pe2 = context->getPathEffects()->popAsOne();
    context->restore();
    auto pe = pe2 ? SkPathEffect::MakeCompose(pe1, pe2) : pe1;
    context->getPathEffects()->push(pe);
  }
};

class JsiDashPathEffectNode : public JsiBasePathEffectNode,
                              public JsiDomNodeCtor<JsiDashPathEffectNode> {
public:
  explicit JsiDashPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skDashPathEffect") {}

  void decorate(DeclarationContext *context) override {

    // Phase
    auto phase = _phase->isSet() ? _phase->value().getAsNumber() : 0;

    // Copy intervals
    std::vector<SkScalar> intervals;
    auto intervalsArray = _intervals->value().getAsArray();
    for (size_t i = 0; i < intervalsArray.size(); ++i) {
      intervals.push_back(intervalsArray[i].getAsNumber());
    }

    // Create effect
    auto pathEffect = SkDashPathEffect::Make(
        intervals.data(), static_cast<int>(intervals.size()), phase);

    composeAndPush(context, pathEffect);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _intervals = container->defineProperty<NodeProp>("intervals");
    _phase = container->defineProperty<NodeProp>("phase");

    _intervals->require();
  }

private:
  NodeProp *_intervals;
  NodeProp *_phase;
};

class JsiDiscretePathEffectNode
    : public JsiBasePathEffectNode,
      public JsiDomNodeCtor<JsiDiscretePathEffectNode> {
public:
  explicit JsiDiscretePathEffectNode(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skDiscretePathEffect") {}

  void decorate(DeclarationContext *context) override {
    // Create effect
    auto pathEffect =
        SkDiscretePathEffect::Make(_lengthProp->value().getAsNumber(),
                                   _deviationProp->value().getAsNumber(),
                                   _seedProp->value().getAsNumber());

    composeAndPush(context, pathEffect);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _lengthProp = container->defineProperty<NodeProp>("length");
    _deviationProp = container->defineProperty<NodeProp>("deviation");
    _seedProp = container->defineProperty<NodeProp>("seed");

    _lengthProp->require();
    _deviationProp->require();
    _seedProp->require();
  }

private:
  NodeProp *_lengthProp;
  NodeProp *_deviationProp;
  NodeProp *_seedProp;
};

class JsiCornerPathEffectNode : public JsiBasePathEffectNode,
                                public JsiDomNodeCtor<JsiCornerPathEffectNode> {
public:
  explicit JsiCornerPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skCornerPathEffect") {}

  void decorate(DeclarationContext *context) override {
    // Create effect
    auto pathEffect = SkCornerPathEffect::Make(_rProp->value().getAsNumber());

    composeAndPush(context, pathEffect);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _rProp = container->defineProperty<NodeProp>("r");
    _rProp->require();
  }

private:
  NodeProp *_rProp;
};

class JsiPath1DPathEffectNode : public JsiBasePathEffectNode,
                                public JsiDomNodeCtor<JsiPath1DPathEffectNode> {
public:
  explicit JsiPath1DPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skPath1DPathEffect") {}

  void decorate(DeclarationContext *context) override {
    // Create effect
    auto pathEffect = SkPath1DPathEffect::Make(
        *_pathProp->getDerivedValue(), _advanceProp->value().getAsNumber(),
        _phaseProp->value().getAsNumber(),
        getStyleFromStringValue(_styleProp->value().getAsString()));

    composeAndPush(context, pathEffect);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _phaseProp = container->defineProperty<NodeProp>("phase");
    _advanceProp = container->defineProperty<NodeProp>("advance");
    _pathProp = container->defineProperty<PathProp>("path");
    _styleProp = container->defineProperty<NodeProp>("style");

    _phaseProp->require();
    _advanceProp->require();
    _pathProp->require();
    _styleProp->require();
  }

private:
  SkPath1DPathEffect::Style getStyleFromStringValue(const std::string &value) {
    if (value == "translate") {
      return SkPath1DPathEffect::kTranslate_Style;
    } else if (value == "rotate") {
      return SkPath1DPathEffect::kRotate_Style;
    } else if (value == "morph") {
      return SkPath1DPathEffect::kMorph_Style;
    }
    throw std::runtime_error("Value \"" + value +
                             "\" is not a valid Path1D effect style.");
  }

  NodeProp *_phaseProp;
  NodeProp *_advanceProp;
  NodeProp *_styleProp;
  PathProp *_pathProp;
};

class JsiPath2DPathEffectNode : public JsiBasePathEffectNode,
                                public JsiDomNodeCtor<JsiPath2DPathEffectNode> {
public:
  explicit JsiPath2DPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skPath2DPathEffect") {}

protected:
  void decorate(DeclarationContext *context) override {

    // Create effect
    auto pathEffect = SkPath2DPathEffect::Make(*_matrixProp->getDerivedValue(),
                                               *_pathProp->getDerivedValue());

    composeAndPush(context, pathEffect);
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _matrixProp = container->defineProperty<MatrixProp>("matrix");
    _pathProp = container->defineProperty<PathProp>("path");

    _matrixProp->require();
    _pathProp->require();
  }

private:
  MatrixProp *_matrixProp;
  PathProp *_pathProp;
};

class JsiLine2DPathEffectNode : public JsiBasePathEffectNode,
                                public JsiDomNodeCtor<JsiLine2DPathEffectNode> {
public:
  explicit JsiLine2DPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skLine2DPathEffect") {}

protected:
  void decorate(DeclarationContext *context) override {

    // Create effect
    auto pathEffect = SkLine2DPathEffect::Make(
        _widthProp->value().getAsNumber(), *_matrixProp->getDerivedValue());

    composeAndPush(context, pathEffect);
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _matrixProp = container->defineProperty<MatrixProp>("matrix");
    _widthProp = container->defineProperty<NodeProp>("width");

    _matrixProp->require();
    _widthProp->require();
  }

private:
  MatrixProp *_matrixProp;
  NodeProp *_widthProp;
};

class JsiSumPathEffectNode : public JsiBasePathEffectNode,
                             public JsiDomNodeCtor<JsiSumPathEffectNode> {
public:
  explicit JsiSumPathEffectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBasePathEffectNode(context, "skSumPathEffect") {}

protected:
  void decorate(DeclarationContext *context) override {
    decorateChildren(context);
    auto pe =
        context->getPathEffects()->Declaration<sk_sp<SkPathEffect>>::popAsOne(
            [=](sk_sp<SkPathEffect> inner, sk_sp<SkPathEffect> outer) {
              return SkPathEffect::MakeSum(inner, outer);
            });
    context->getPathEffects()->push(pe);
  }
};
} // namespace RNSkia
