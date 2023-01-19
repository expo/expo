#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkSVG.h"
#include "JsiSkTypeface.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkStream.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkSVGFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeFromData) {
    auto data = JsiSkData::fromValue(runtime, arguments[0]);
    auto stream = SkMemoryStream::Make(data);
    auto svg_dom = SkSVGDOM::Builder().make(*stream);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkSVG>(getContext(), std::move(svg_dom)));
  }

  JSI_HOST_FUNCTION(MakeFromString) {
    auto svgText = arguments[0].asString(runtime).utf8(runtime);
    auto stream = SkMemoryStream::MakeDirect(svgText.c_str(), svgText.size());
    auto svg_dom = SkSVGDOM::Builder().make(*stream);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkSVG>(getContext(), std::move(svg_dom)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkSVGFactory, MakeFromData),
                       JSI_EXPORT_FUNC(JsiSkSVGFactory, MakeFromString))

  explicit JsiSkSVGFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
