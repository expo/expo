#pragma once

#include "DerivedNodeProp.h"

#include <memory>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkVertices.h"

#pragma clang diagnostic pop

namespace RNSkia {

class VertexModeProp : public DerivedProp<SkVertices::VertexMode> {
public:
  explicit VertexModeProp(PropId name,
                          const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkVertices::VertexMode>(onChange) {
    _vertexModeProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_vertexModeProp->isSet() && (_vertexModeProp->isChanged())) {
      auto vertexModeValue = _vertexModeProp->value().getAsString();
      setDerivedValue(getVertexModeFromStringValue(vertexModeValue));
    }
  }

private:
  SkVertices::VertexMode
  getVertexModeFromStringValue(const std::string &value) {
    if (value == "triangles") {
      return SkVertices::VertexMode::kTriangles_VertexMode;
    } else if (value == "triangleStrip") {
      return SkVertices::VertexMode::kTriangleStrip_VertexMode;
    } else if (value == "triangleFan") {
      return SkVertices::VertexMode::kTriangleFan_VertexMode;
    }
    throw std::runtime_error("Property value \"" + value +
                             "\" is not a legal blend mode.");
  }

  NodeProp *_vertexModeProp;
};

} // namespace RNSkia
