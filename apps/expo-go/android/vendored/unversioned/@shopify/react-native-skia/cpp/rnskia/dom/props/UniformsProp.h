#pragma once

#include "DerivedNodeProp.h"
#include "JsiSkRuntimeEffect.h"

#include <memory>
#include <string>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRuntimeEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

bool isJSPoint(const JsiValue &value) {
  return value.getType() == PropType::Object && value.hasValue(PropNameX) &&
         value.hasValue(PropNameY);
}

bool isSkPoint(const JsiValue &value) {
  return value.getType() == PropType::HostObject &&
         std::dynamic_pointer_cast<JsiSkPoint>(value.getAsHostObject()) !=
             nullptr;
}

bool isIndexable(const JsiValue &value) {
  return value.getType() == PropType::Object && value.hasValue(PropName0);
}

void processValue(std::vector<SkScalar> &values, const JsiValue &value) {
  if (value.getType() == PropType::Number) {
    auto n = value.getAsNumber();
    values.push_back(n);
  } else if (value.getType() == PropType::Array) {
    auto arrayValue = value.getAsArray();
    for (size_t i = 0; i < arrayValue.size(); ++i) {
      auto a = arrayValue[i];
      processValue(values, a);
    }
  } else if (isJSPoint(value) || isSkPoint(value)) {
    auto pointValue = PointProp::processValue(value);
    values.push_back(pointValue.x());
    values.push_back(pointValue.y());
  } else if (isIndexable(value)) {
    auto length = value.getKeys().size();
    for (size_t i = 0; i < length; ++i) {
      values.push_back(
          value.getValue(JsiPropId::get(std::to_string(i))).getAsNumber());
    }
  }
}

void processUniform(std::vector<SkScalar> &values, SkRuntimeEffect *source,
                    const JsiValue &uniforms, SkRuntimeShaderBuilder *rtb) {
  auto uniformsCount = source->uniforms().size();
  for (size_t i = 0; i < uniformsCount; ++i) {
    auto it = source->uniforms().begin() + i;
    auto name = JsiPropId::get(std::string(it->name));
    if (!uniforms.hasValue(name)) {
      throw std::runtime_error("The runtime effect has the uniform value \"" +
                               std::string(name) +
                               "\" declared, but it is missing from the "
                               "uniforms property of the Runtime effect.");
    }
    auto value = uniforms.getValue(name);
    if (rtb == nullptr) {
      processValue(values, value);
    } else {
      std::vector<SkScalar> uniformValue;
      processValue(uniformValue, value);
      rtb->uniform(name).set(uniformValue.data(),
                             static_cast<int>(uniformValue.size()));
    }
  }
}

class UniformsProp : public DerivedSkProp<SkData> {
public:
  UniformsProp(PropId name, NodeProp *sourceProp,
               const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedSkProp<SkData>(onChange) {
    _uniformsProp = defineProperty<NodeProp>(name);
    _sourceProp = sourceProp;
  }

  void updateDerivedValue() override {
    if (!_uniformsProp->isSet()) {
      return;
    }

    // Get the effect
    auto source = _sourceProp->value().getAs<JsiSkRuntimeEffect>()->getObject();

    // Flatten uniforms from property
    std::vector<SkScalar> uniformValues;
    processUniform(uniformValues, source.get(), _uniformsProp->value(),
                   nullptr);

    // Cast uniforms according to the declaration in the shader
    auto uniformsData = castUniforms(source.get(), uniformValues);

    // Save derived value
    setDerivedValue(uniformsData);
  }

  void processUniforms(SkRuntimeShaderBuilder &rtb) {
    if (!_uniformsProp->isSet()) {
      return;
    }

    // Get the effect
    auto source = _sourceProp->value().getAs<JsiSkRuntimeEffect>()->getObject();
    // Flatten uniforms from property
    std::vector<SkScalar> uniformValues;
    processUniform(uniformValues, source.get(), _uniformsProp->value(), &rtb);
  }

private:
  sk_sp<SkData> castUniforms(SkRuntimeEffect *source,
                             const std::vector<SkScalar> &values) {
    // Create memory for uniforms
    auto uniformSize = source->uniformSize();
    if (values.size() * sizeof(float) != uniformSize) {
      throw std::runtime_error(
          "Uniforms size differs from effect's uniform size. Received " +
          std::to_string(values.size()) + " expected " +
          std::to_string(uniformSize / sizeof(float)));
    }
    auto uniformsData = SkData::MakeUninitialized(uniformSize);

    // Loop through all uniforms in the effect and load data from the flattened
    // array of values
    const auto &u = source->uniforms();
    for (std::size_t i = 0; i < u.size(); i++) {
      auto it = source->uniforms().begin() + i;
      RuntimeEffectUniform reu = JsiSkRuntimeEffect::fromUniform(*it);
      for (std::size_t j = 0; j < reu.columns * reu.rows; ++j) {
        const std::size_t offset = reu.slot + j;
        float fValue = values.at(offset);
        int iValue = static_cast<int>(fValue);
        auto value = reu.isInteger ? SkBits2Float(iValue) : fValue;
        memcpy(SkTAddOffset<void>(uniformsData->writable_data(),
                                  offset * sizeof(value)),
               &value, sizeof(value));
      }
    }

    return uniformsData;
  }

  NodeProp *_uniformsProp;
  NodeProp *_sourceProp;
};

} // namespace RNSkia
