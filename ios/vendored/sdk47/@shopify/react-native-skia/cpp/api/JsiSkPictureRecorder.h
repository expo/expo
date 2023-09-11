
#pragma once

#include "JsiSkHostObjects.h"
#include "JsiSkRect.h"
#include "JsiSkPicture.h"
#include "JsiSkCanvas.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPictureRecorder.h>
#include <SkBBHFactory.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkPictureRecorder : public JsiSkWrappingSharedPtrHostObject<SkPictureRecorder> {
public:

  JsiSkPictureRecorder(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context)
      : JsiSkWrappingSharedPtrHostObject<SkPictureRecorder>(
            context, std::make_shared<SkPictureRecorder>()){};

  JSI_HOST_FUNCTION(beginRecording) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    SkRTreeFactory factory;
    auto canvas = getObject()->beginRecording(*rect, &factory);
    return jsi::Object::createFromHostObject(
      runtime, std::make_shared<JsiSkCanvas>(getContext(), canvas));
  }
  
  JSI_HOST_FUNCTION(finishRecordingAsPicture) {
    auto picture = getObject()->finishRecordingAsPicture();
    return jsi::Object::createFromHostObject(
      runtime, std::make_shared<JsiSkPicture>(getContext(), picture));
  }
  
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPictureRecorder, beginRecording),
                       JSI_EXPORT_FUNC(JsiSkPictureRecorder, finishRecordingAsPicture))
  
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context) {
      return JSI_HOST_FUNCTION_LAMBDA {
        return jsi::Object::createFromHostObject(
                runtime, std::make_shared<JsiSkPictureRecorder>(context));
      };
  }
};
} // namespace ABI47_0_0RNSkia
