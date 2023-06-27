#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkSVG.h"

#include <memory>

namespace RNSkia {

class SvgProp : public DerivedSkProp<SkSVGDOM> {
public:
  explicit SvgProp(PropId name,
                   const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedSkProp<SkSVGDOM>(onChange) {
    _imageSvgProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_imageSvgProp->isSet()) {

      if (_imageSvgProp->value().getType() == PropType::HostObject) {

        auto ptr = std::dynamic_pointer_cast<JsiSkSVG>(
            _imageSvgProp->value().getAsHostObject());
        if (ptr == nullptr) {
          throw std::runtime_error(
              "Expected SkSvgDom object for the svg property.");
        }
        setDerivedValue(ptr->getObject());
      } else {
        throw std::runtime_error(
            "Expected SkSvgDom object or null/undefined for the svg property.");
      }

    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_imageSvgProp;
};

} // namespace RNSkia
