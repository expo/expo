#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkSVG.h"

#include <memory>

namespace RNSkia {

class SvgProp : public DerivedSkProp<SkSVGDOM> {
public:
  explicit SvgProp(PropId name) : DerivedSkProp<SkSVGDOM>() {
    _imageSvgProp = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    if (_imageSvgProp->value().getType() != PropType::HostObject) {
      throw std::runtime_error(
          "Expected SkSvgDom object for the svg property.");
    }

    auto ptr = std::dynamic_pointer_cast<JsiSkSVG>(
        _imageSvgProp->value().getAsHostObject());
    if (ptr == nullptr) {
      throw std::runtime_error(
          "Expected SkSvgDom object for the svg property.");
    }

    setDerivedValue(ptr->getObject());
  }

private:
  NodeProp *_imageSvgProp;
};

} // namespace RNSkia
