#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#include "JsiSkCanvas.h"
#include "JsiSkImage.h"
#include "JsiSkSurfaceFactory.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkSurface.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkSurface : public JsiSkWrappingSkPtrHostObject<SkSurface> {
public:
  JsiSkSurface(std::shared_ptr<RNSkPlatformContext> context,
               sk_sp<SkSurface> surface)
      : JsiSkWrappingSkPtrHostObject<SkSurface>(std::move(context),
                                                std::move(surface)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkSurface, "Surface")

  JSI_HOST_FUNCTION(getCanvas) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkCanvas>(getContext(), getObject()->getCanvas()));
  }

  JSI_HOST_FUNCTION(flush) {
    getObject()->flush();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(makeImageSnapshot) {
    sk_sp<SkImage> image;
    if (count == 1) {
      auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
      image = getObject()->makeImageSnapshot(SkIRect::MakeXYWH(
          rect->x(), rect->y(), rect->width(), rect->height()));
    } else {
      image = getObject()->makeImageSnapshot();
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkSurface, getCanvas),
                       JSI_EXPORT_FUNC(JsiSkSurface, makeImageSnapshot),
                       JSI_EXPORT_FUNC(JsiSkSurface, flush),
                       JSI_EXPORT_FUNC(JsiSkSurface, dispose))
};

} // namespace RNSkia
