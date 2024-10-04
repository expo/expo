#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#include <JsiSkSurface.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkImage.h"
#include "SkSurface.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkSurfaceFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(Make) {
    auto width = static_cast<int>(arguments[0].asNumber());
    auto height = static_cast<int>(arguments[1].asNumber());
    auto surface = SkSurface::MakeRasterN32Premul(width, height);
    if (surface == nullptr) {
      return jsi::Value::null();
    }
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkSurface>(getContext(), std::move(surface)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkSurfaceFactory, Make))

  explicit JsiSkSurfaceFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
