#pragma once

#include "DerivedNodeProp.h"

#include "ColorProp.h"
#include "NumbersProp.h"
#include "PointsProp.h"
#include "VertexModeProp.h"

#include <memory>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkVertices.h"

#pragma clang diagnostic pop

namespace RNSkia {

class VerticesProps : public DerivedSkProp<SkVertices> {
public:
  explicit VerticesProps(const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedSkProp<SkVertices>(onChange) {
    _vertexModeProp = defineProperty<VertexModeProp>("mode");
    _colorsProp = defineProperty<ColorsProp>("colors");
    _verticesProp = defineProperty<PointsProp>("vertices");
    _texturesProp = defineProperty<PointsProp>("textures");
    _indicesProp = defineProperty<Numbers16Prop>("indices");

    _vertexModeProp->require();
    _verticesProp->require();
  }

  bool hasColors() { return _colorsProp->isSet(); }

  void updateDerivedValue() override {
    const SkVertices::VertexMode *vertextMode =
        _vertexModeProp->getDerivedValue().get();
    const std::vector<SkColor> *colors = _colorsProp->getDerivedValue().get();
    auto vertices = _verticesProp->getDerivedValue();
    auto textures = _texturesProp->getDerivedValue();
    auto indices = _indicesProp->getDerivedValue();

    setDerivedValue(SkVertices::MakeCopy(
        *vertextMode, static_cast<int>(vertices->size()),
        _verticesProp->isSet() ? vertices->data() : nullptr,
        _texturesProp->isSet() ? textures->data() : nullptr,
        _colorsProp->isSet() ? colors->data() : nullptr,
        _indicesProp->isSet() ? static_cast<int>(indices->size()) : 0,
        _indicesProp->isSet() ? indices->data() : nullptr));
  }

private:
  VertexModeProp *_vertexModeProp;
  ColorsProp *_colorsProp;
  PointsProp *_verticesProp;
  PointsProp *_texturesProp;
  Numbers16Prop *_indicesProp;
};

} // namespace RNSkia
