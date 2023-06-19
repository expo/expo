#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkFont.h"

#include <memory>

namespace RNSkia {

class FontProp : public DerivedProp<SkFont> {
public:
  explicit FontProp(PropId name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkFont>(onChange) {
    _fontProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_fontProp->isSet()) {
      if (_fontProp->value().getType() == PropType::HostObject) {
        auto ptr = _fontProp->value().getAs<JsiSkFont>();
        if (ptr == nullptr) {
          throw std::runtime_error(
              "Expected SkFont object for the Font property.");
        }
        setDerivedValue(ptr->getObject());

      } else {
        throw std::runtime_error(
            "Expected SkFont object or null/undefined for the Font property.");
      }
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_fontProp;
};

} // namespace RNSkia
