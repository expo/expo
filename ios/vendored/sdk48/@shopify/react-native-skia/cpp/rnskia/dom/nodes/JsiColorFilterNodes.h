#pragma once

#include "JsiDomDeclarationNode.h"

#include "BlendModeProp.h"
#include "ColorProp.h"
#include "NodeProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkColorFilter.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

class JsiBaseColorFilterNode
    : public JsiDomDeclarationNode<JsiBaseColorFilterNode,
                                   sk_sp<SkColorFilter>> {
public:
  JsiBaseColorFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                         const char *type)
      : JsiDomDeclarationNode<JsiBaseColorFilterNode, sk_sp<SkColorFilter>>(
            context, type) {}

protected:
  sk_sp<SkColorFilter> resolve(std::shared_ptr<JsiDomNode> child) override {
    auto ptr = std::dynamic_pointer_cast<JsiBaseColorFilterNode>(child);
    if (ptr) {
      return ptr->getCurrent();
    }
    return nullptr;
  }

  void setColorFilter(DrawingContext *context, sk_sp<SkColorFilter> f) {
    set(context, f);
  }

  void set(DrawingContext *context, sk_sp<SkColorFilter> ColorFilter) override {
    auto paint = context->getMutablePaint();
    if (paint->getColorFilter() != nullptr &&
        paint->getColorFilter() != getCurrent().get()) {
      paint->setColorFilter(
          SkColorFilters::Compose(ColorFilter, paint->refColorFilter()));
    } else {
      paint->setColorFilter(ColorFilter);
    }

    setCurrent(ColorFilter);
  }
};

class JsiMatrixColorFilterNode
    : public JsiBaseColorFilterNode,
      public JsiDomNodeCtor<JsiMatrixColorFilterNode> {
public:
  explicit JsiMatrixColorFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skMatrixColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      auto array = _matrixProp->value().getAsArray();
      float matrix[20];
      for (int i = 0; i < 20; i++) {
        if (array.size() > i) {
          matrix[i] = array[i].getAsNumber();
        }
      }
      setColorFilter(context, SkColorFilters::Matrix(matrix));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _matrixProp = container->defineProperty<NodeProp>("matrix");
    _matrixProp->require();
  }

private:
  NodeProp *_matrixProp;
};

class JsiBlendColorFilterNode : public JsiBaseColorFilterNode,
                                public JsiDomNodeCtor<JsiBlendColorFilterNode> {
public:
  explicit JsiBlendColorFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skBlendColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      setColorFilter(context,
                     SkColorFilters::Blend(*_colorProp->getDerivedValue(),
                                           *_blendModeProp->getDerivedValue()));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
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
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLinearToSRGBGammaColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      setColorFilter(context, SkColorFilters::LinearToSRGBGamma());
    }
  }
};

class JsiSRGBToLinearGammaColorFilterNode
    : public JsiBaseColorFilterNode,
      public JsiDomNodeCtor<JsiSRGBToLinearGammaColorFilterNode> {
public:
  explicit JsiSRGBToLinearGammaColorFilterNode(
      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skSRGBToLinearGammaColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      setColorFilter(context, SkColorFilters::SRGBToLinearGamma());
    }
  }
};

class JsiLumaColorFilterNode : public JsiBaseColorFilterNode,
                               public JsiDomNodeCtor<JsiLumaColorFilterNode> {
public:
  explicit JsiLumaColorFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLumaColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      setColorFilter(context, SkLumaColorFilter::Make());
    }
  }
};

class JsiLerpColorFilterNode : public JsiBaseColorFilterNode,
                               public JsiDomNodeCtor<JsiLerpColorFilterNode> {
public:
  explicit JsiLerpColorFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseColorFilterNode(context, "skLerpColorFilter") {}

protected:
  void decorate(DrawingContext *context) override {
    if (isChanged(context)) {
      setColorFilter(context,
                     SkColorFilters::Lerp(_tProp->value().getAsNumber(),
                                          requireChild(0), requireChild(1)));
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _tProp = container->defineProperty<NodeProp>("t");
    _tProp->require();
  }

private:
  NodeProp *_tProp;
};

} // namespace ABI48_0_0RNSkia
