#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRSXform.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkRSXform : public JsiSkWrappingSharedPtrHostObject<SkRSXform> {
public:
  JsiSkRSXform(std::shared_ptr<RNSkPlatformContext> context,
               const SkRSXform &rsxform)
      : JsiSkWrappingSharedPtrHostObject<SkRSXform>(
            std::move(context), std::make_shared<SkRSXform>(rsxform)) {}

  JSI_API_TYPENAME("RSXform");

  JSI_PROPERTY_GET(scos) {
    return jsi::Value(SkScalarToDouble(getObject()->fSCos));
  }
  JSI_PROPERTY_GET(ssin) {
    return jsi::Value(SkScalarToDouble(getObject()->fSSin));
  }
  JSI_PROPERTY_GET(tx) {
    return jsi::Value(SkScalarToDouble(getObject()->fTx));
  }
  JSI_PROPERTY_GET(ty) {
    return jsi::Value(SkScalarToDouble(getObject()->fTy));
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkRSXform, __typename__),
                              JSI_EXPORT_PROP_GET(JsiSkRSXform, scos),
                              JSI_EXPORT_PROP_GET(JsiSkRSXform, ssin),
                              JSI_EXPORT_PROP_GET(JsiSkRSXform, tx),
                              JSI_EXPORT_PROP_GET(JsiSkRSXform, ty))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkRSXform, dispose))

  /**
  Returns the underlying object from a host object of this type
 */
  static std::shared_ptr<SkRSXform> fromValue(jsi::Runtime &runtime,
                                              const jsi::Value &obj) {
    const auto &object = obj.asObject(runtime);
    if (object.isHostObject(runtime)) {
      return object.asHostObject<JsiSkRSXform>(runtime)->getObject();
    } else {
      auto scos =
          object.getArray(runtime).getValueAtIndex(runtime, 0).asNumber();
      auto ssin =
          object.getArray(runtime).getValueAtIndex(runtime, 1).asNumber();
      auto tx = object.getArray(runtime).getValueAtIndex(runtime, 2).asNumber();
      auto ty = object.getArray(runtime).getValueAtIndex(runtime, 3).asNumber();
      return std::make_shared<SkRSXform>(SkRSXform::Make(scos, ssin, tx, ty));
    }
  }

  /**
  Returns the jsi object from a host object of this type
 */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkRSXform &rsxform) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRSXform>(std::move(context), rsxform));
  }

  /**
   * Creates the function for construction a new instance of the SkRSXform
   * wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the SkRSXform
   * class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto rsxform =
          SkRSXform::Make(arguments[0].asNumber(), arguments[1].asNumber(),
                          arguments[2].asNumber(), arguments[3].asNumber());
      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkRSXform>(std::move(context),
                                                  std::move(rsxform)));
    };
  }
};
} // namespace RNSkia
