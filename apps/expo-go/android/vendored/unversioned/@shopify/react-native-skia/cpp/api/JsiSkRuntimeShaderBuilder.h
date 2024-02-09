#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "JsiSkRuntimeEffect.h"
#include "SkRuntimeEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkRuntimeShaderBuilder
    : public JsiSkWrappingSharedPtrHostObject<SkRuntimeShaderBuilder> {
public:
  /**
   Constructor
   */
  JsiSkRuntimeShaderBuilder(std::shared_ptr<RNSkPlatformContext> context,
                            const SkRuntimeShaderBuilder &rt)
      : JsiSkWrappingSharedPtrHostObject<SkRuntimeShaderBuilder>(
            std::move(context), std::make_shared<SkRuntimeShaderBuilder>(rt)) {}

  JSI_HOST_FUNCTION(setUniform) {
    auto name = arguments[0].asString(runtime).utf8(runtime);
    auto jsiValue = arguments[1].asObject(runtime).asArray(runtime);
    auto size = jsiValue.size(runtime);
    std::vector<SkScalar> value;
    value.reserve(size);
    for (int i = 0; i < size; i++) {
      auto e = jsiValue.getValueAtIndex(runtime, i).asNumber();
      value.push_back(e);
    }
    getObject()
        ->uniform(name.c_str())
        .set(value.data(), static_cast<int>(size));
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkRuntimeShaderBuilder, setUniform),
                       JSI_EXPORT_FUNC(JsiSkRuntimeShaderBuilder, dispose))

  /**
    Returns the jsi object from a host object of this type
   */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkRuntimeShaderBuilder &rt) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkRuntimeShaderBuilder>(std::move(context), rt));
  }

  /**
   * Creates the function for construction a new instance of the SkRect
   * wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the SkRect
   * class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto rt = JsiSkRuntimeEffect::fromValue(runtime, arguments[0]);
      auto rtb = SkRuntimeShaderBuilder(rt);
      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkRuntimeShaderBuilder>(
                       std::move(context), std::move(rtb)));
    };
  }
};
} // namespace RNSkia
