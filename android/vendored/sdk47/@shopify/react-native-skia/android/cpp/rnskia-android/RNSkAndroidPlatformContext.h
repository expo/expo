#pragma once

#include <functional>
#include <string>
#include <memory>
#include <exception>

#include <JniPlatformContext.h>
#include <RNSkPlatformContext.h>

namespace RNSkia {
    using namespace facebook;

    class RNSkAndroidPlatformContext: public RNSkPlatformContext {
    public:
        RNSkAndroidPlatformContext(JniPlatformContext* jniPlatformContext,
                                   jsi::Runtime *runtime,
                                   std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker) :
            RNSkPlatformContext(runtime,
                                jsCallInvoker,
                                jniPlatformContext->getPixelDensity()),
            _jniPlatformContext(jniPlatformContext) {
            // Hook onto the notify draw loop callback in the platform context
            jniPlatformContext->setOnNotifyDrawLoop([this]() {
                notifyDrawLoop(false);
            });
        }


    void performStreamOperation(
            const std::string &sourceUri,
            const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) override {
        _jniPlatformContext->performStreamOperation(sourceUri, op);
    }

    void raiseError(const std::exception &err) override {
        _jniPlatformContext->raiseError(err);
    }

    void startDrawLoop() override {
        _jniPlatformContext->startDrawLoop();
    }

    void stopDrawLoop() override {
        _jniPlatformContext->stopDrawLoop();
    }

    private:

        JniPlatformContext* _jniPlatformContext;
    };

}

