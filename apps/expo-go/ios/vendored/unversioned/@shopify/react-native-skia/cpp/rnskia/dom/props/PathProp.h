#pragma once

#include "DerivedNodeProp.h"
#include "JsiSkPath.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPath.h"

#pragma clang diagnostic pop

namespace RNSkia {

class PathProp : public DerivedProp<SkPath> {
public:
  explicit PathProp(PropId name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPath>(onChange) {
    _pathProp = defineProperty<NodeProp>(name);
  }

  static std::shared_ptr<SkPath> processPath(const JsiValue &value) {
    if (value.getType() == PropType::HostObject) {
      // Try reading as Path
      auto ptr = std::dynamic_pointer_cast<JsiSkPath>(value.getAsHostObject());
      if (ptr != nullptr) {
        return ptr->getObject();
      }
    } else if (value.getType() == PropType::String) {
      // Read as string
      auto pathString = value.getAsString();
      SkPath result;

      if (SkParsePath::FromSVGString(pathString.c_str(), &result)) {
        return std::make_shared<SkPath>(result);
      } else {
        throw std::runtime_error("Could not parse path from string.");
      }
    }
    return nullptr;
  }

  void updateDerivedValue() override {
    if (!_pathProp->isSet()) {
      setDerivedValue(nullptr);
      return;
    }
    auto value = _pathProp->value();
    setDerivedValue(PathProp::processPath(value));
  }

private:
  NodeProp *_pathProp;
};

} // namespace RNSkia
