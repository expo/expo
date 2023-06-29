#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFont.h"
#include "SkStream.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkData : public JsiSkWrappingSkPtrHostObject<SkData> {
public:
  JsiSkData(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context, sk_sp<SkData> asset)
      : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(asset)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkData, "Data")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkData, dispose))
};
} // namespace ABI49_0_0RNSkia
