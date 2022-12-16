#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiSkFontMgr.h"
#include "JsiSkData.h"
#include <SkFontMgr.h>


namespace RNSkia {

    using namespace facebook;

    class JsiSkFontMgrFactory : public JsiSkHostObject {
    public:
//        JSI_HOST_FUNCTION(FromData) {
//            std::vector<sk_sp<SkData>> data;
//            for (int i = 0; i < count; i++) {
//                auto d = JsiSkData::fromValue(
//                        runtime, arguments[i]);
//                data.push_back(d);
//            }
//
//            auto fontMgr = SkFontMgr_New_Custom_Data(data.data(), data.size());
//            return jsi::Object::createFromHostObject(
//            runtime, std::make_shared<JsiSkFontMgr>(getContext(), fontMgr));
//        }

        JSI_HOST_FUNCTION(RefDefault) {
            auto fontMgr = SkFontMgr::RefDefault();
            return jsi::Object::createFromHostObject(
                    runtime, std::make_shared<JsiSkFontMgr>(getContext(), std::move(fontMgr)));
        }

        JSI_EXPORT_FUNCTIONS(
                //JSI_EXPORT_FUNC(JsiSkFontMgrFactory, FromData),
                JSI_EXPORT_FUNC(JsiSkFontMgrFactory, RefDefault)
        )

        JsiSkFontMgrFactory(std::shared_ptr<RNSkPlatformContext> context)
                : JsiSkHostObject(std::move(context)) {}
    };

} // namespace RNSkia
