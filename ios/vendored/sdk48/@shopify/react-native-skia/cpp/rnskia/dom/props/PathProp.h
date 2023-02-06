#pragma once

#include "DerivedNodeProp.h"
#include "JsiSkPath.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPath.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

class PathProp : public DerivedProp<SkPath> {
public:
  explicit PathProp(PropId name) : DerivedProp<SkPath>() {
    _pathProp = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    if (!_pathProp->isSet()) {
      setDerivedValue(nullptr);
      return;
    }

    if (_pathProp->value().getType() == PropType::HostObject) {
      // Try reading as Path
      auto ptr = std::dynamic_pointer_cast<JsiSkPath>(
          _pathProp->value().getAsHostObject());
      if (ptr != nullptr) {
        setDerivedValue(ptr->getObject());
      }
    } else if (_pathProp->value().getType() == PropType::String) {
      // Read as string
      auto pathString = _pathProp->value().getAsString();
      SkPath result;

      if (SkParsePath::FromSVGString(pathString.c_str(), &result)) {
        setDerivedValue(std::make_shared<SkPath>(result));
      } else {
        throw std::runtime_error("Could not parse path from string.");
      }
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_pathProp;
};

} // namespace ABI48_0_0RNSkia
