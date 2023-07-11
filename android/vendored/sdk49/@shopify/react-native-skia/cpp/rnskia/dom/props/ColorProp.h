#pragma once

#include "DerivedNodeProp.h"
#include "third_party/CSSColorParser.h"

#include <memory>
#include <utility>
#include <vector>

namespace RNSkia {

static PropId PropName0 = JsiPropId::get("0");
static PropId PropName1 = JsiPropId::get("1");
static PropId PropName2 = JsiPropId::get("2");
static PropId PropName3 = JsiPropId::get("3");

class ColorProp : public DerivedProp<SkColor> {
public:
  explicit ColorProp(PropId name,
                     const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkColor>(onChange) {
    _colorProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_colorProp->isSet()) {
      // Color might be a number, a string or a Float32Array of rgba values
      setDerivedValue(
          std::make_shared<SkColor>(parseColorValue(_colorProp->value())));
    } else {
      setDerivedValue(nullptr);
    }
  }

  static SkColor parseColorValue(const JsiValue &color) {
    if (color.getType() == PropType::Object) {
      // Float array
      auto r = color.getValue(PropName0);
      auto g = color.getValue(PropName1);
      auto b = color.getValue(PropName2);
      auto a = color.getValue(PropName3);
      return SkColorSetARGB(a.getAsNumber() * 255.0f, r.getAsNumber() * 255.0f,
                            g.getAsNumber() * 255.0f, b.getAsNumber() * 255.0f);

    } else if (color.getType() == PropType::Array) {
      auto r = color.getAsArray().at(0);
      auto g = color.getAsArray().at(1);
      auto b = color.getAsArray().at(2);
      auto a = color.getAsArray().at(3);
      return SkColorSetARGB(a.getAsNumber() * 255.0f, r.getAsNumber() * 255.0f,
                            g.getAsNumber() * 255.0f, b.getAsNumber() * 255.0f);
    } else if (color.getType() == PropType::Number) {
      return static_cast<SkColor>(color.getAsNumber());
    } else {
      auto parsedColor = CSSColorParser::parse(color.getAsString());
      if (parsedColor.a == -1.0f) {
        return SK_ColorBLACK;
      } else {
        return SkColorSetARGB(parsedColor.a * 255, parsedColor.r, parsedColor.g,
                              parsedColor.b);
      }
    }
  }

private:
  NodeProp *_colorProp;
};

class ColorsProp : public DerivedProp<std::vector<SkColor>> {
public:
  explicit ColorsProp(PropId name,
                      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<std::vector<SkColor>>(onChange) {
    _colorsProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_colorsProp->isSet()) {
      auto colors = _colorsProp->value().getAsArray();
      std::vector<SkColor> derivedColors;
      derivedColors.reserve(colors.size());

      for (size_t i = 0; i < colors.size(); ++i) {
        derivedColors.push_back(ColorProp::parseColorValue(colors[i]));
      }
      setDerivedValue(std::move(derivedColors));
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_colorsProp;
};

} // namespace RNSkia
