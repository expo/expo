#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkFont.h>
#include <SkFontMgr.h>
#include <SkTypeface.h>

#pragma clang diagnostic pop


namespace RNSkia {

    using namespace facebook;

    class JsiSkFontMgr : public JsiSkWrappingSkPtrHostObject<SkFontMgr> {
    public:

        // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?
        JSI_PROPERTY_GET(__typename__) {
            return jsi::String::createFromUtf8(runtime, "FontMgr");
        }

        JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkFontMgr, __typename__))

        JsiSkFontMgr(std::shared_ptr<RNSkPlatformContext> context,
                     sk_sp<SkFontMgr> fontMgr)
                : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(fontMgr)) {}

        JSI_HOST_FUNCTION(countFamilies) {
            auto families = getObject()->countFamilies();
            return jsi::Value(families);
        }

        JSI_HOST_FUNCTION(getFamilyName) {
            auto i = arguments[0].asNumber();
            SkString familyName;
            getObject()->getFamilyName(i, &familyName);
            return jsi::String::createFromUtf8(runtime, familyName.c_str());
        }

        JSI_HOST_FUNCTION(matchFamilyStyle) {
            auto familyName = arguments[0].asString(runtime).utf8(runtime);
            auto fontStyle = SkFontStyle::Normal();
            if (count >= 2) {
                auto object = arguments[1].asObject(runtime);
                int weight = object.getProperty(runtime, "weight").asNumber();
                int width = object.getProperty(runtime, "width").asNumber();
                SkFontStyle::Slant slant = (SkFontStyle::Slant)object.getProperty(runtime, "slant").asNumber();
                fontStyle = SkFontStyle(width, weight, slant);
            }
            auto typeface = getObject()->matchFamilyStyle(familyName.c_str(), std::move(fontStyle));
            if (typeface == nullptr) {
                return jsi::Value::null();
            }
            return jsi::Object::createFromHostObject(
                    runtime, std::make_shared<JsiSkTypeface>(getContext(), sk_sp<SkTypeface>(std::move(typeface))));;
        }

        JSI_EXPORT_FUNCTIONS(
            JSI_EXPORT_FUNC(JsiSkFontMgr, countFamilies),
            JSI_EXPORT_FUNC(JsiSkFontMgr, getFamilyName),
            JSI_EXPORT_FUNC(JsiSkFontMgr, matchFamilyStyle)
        )

        /**
          Returns the underlying object from a host object of this type
         */
        static sk_sp<SkFontMgr> fromValue(jsi::Runtime &runtime,
                                           const jsi::Value &obj) {
            return obj.asObject(runtime)
                    .asHostObject<JsiSkFontMgr>(runtime)
                    ->getObject();
        }
    };
} // namespace RNSkia
