//
// Created by Marc Rousavy on 13.07.21.
//


#include "JAVManager.h"

#include <jsi/jsi.h>

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>
#include <string>

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

#include <android/log.h>

namespace expo {

using namespace facebook;
using namespace jni;

using TSelf = local_ref<HybridClass<expo::JAVManager>::jhybriddata>;

TSelf JAVManager::initHybrid(alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void JAVManager::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JAVManager::initHybrid),
        makeNativeMethod("installJSIBindings", JAVManager::installJSIBindings),
    });
}

JPlayerData* JAVManager::getMediaPlayerById(int id) {
    static const auto func = javaPart_->getClass()->getMethod<JPlayerData*(jint)>("getMediaPlayerById");
    auto result = func(javaPart_.get(), id);
    return result->cthis();
}

void JAVManager::installJSIBindings(jlong jsRuntimePointer,
                                    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {
    auto& runtime = *reinterpret_cast<jsi::Runtime*>(jsRuntimePointer);
    auto callInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

    auto function = [this](jsi::Runtime &runtime,
                           const jsi::Value &thisValue,
                           const jsi::Value *args,
                           size_t argsCount) -> jsi::Value {
        __android_log_write(ANDROID_LOG_INFO, TAG, "called");
        auto playerId = args[0].asNumber();

        __android_log_write(ANDROID_LOG_INFO, TAG, "player");
        auto mediaPlayer = getMediaPlayerById(static_cast<int>(playerId));
        if (mediaPlayer == nullptr) {
            auto message = "Sound Instance with ID " + std::to_string(playerId) + "does not exist!";
            throw jsi::JSError(runtime, message.c_str());
        }
        __android_log_write(ANDROID_LOG_INFO, TAG, "got player!");

        if (argsCount > 1 && args[1].isObject() && !args[1].isUndefined()) {
            // second parameter received, it's the callback function.
            auto callback = args[1].asObject(runtime).asFunction(runtime);
            auto callbackShared = std::make_shared<jsi::Function>(std::move(callback));
            __android_log_write(ANDROID_LOG_INFO, TAG, "moved callback!");

            mediaPlayer->setSampleBufferCallback([callbackShared, &runtime](jni::alias_ref<jni::JArrayByte> sampleBuffer)  {
                __android_log_write(ANDROID_LOG_INFO, TAG, "callback called.");
                auto channelsCount = /* TODO: channelsCount */ 1;
                auto size = sampleBuffer->size();

                std::vector<jbyte> buffer(size);
                sampleBuffer->getRegion(0, size, buffer.data());

                // TODO: Run per channel instead of flat array?
                auto channels = jsi::Array(runtime, channelsCount);
                for (auto i = 0; i < channelsCount; i++) {
                    auto channel = jsi::Object(runtime);

                    auto frames = jsi::Array(runtime, size);

                    for (size_t ii = 0; ii < size; ii++) {
                        frames.setValueAtIndex(runtime, i, jsi::Value((int)buffer[i]));
                    }

                    channel.setProperty(runtime, "frames", frames);
                    channels.setValueAtIndex(runtime, i, channel);
                }
                __android_log_write(ANDROID_LOG_INFO, TAG, "created obj");

                auto sample = jsi::Object(runtime);
                sample.setProperty(runtime, "channels", channels);
                sample.setProperty(runtime, "timestamp", jsi::Value(13));
                // TODO: callInvoker->invokeAsync([]() {}) ?
                callbackShared->call(runtime, sample);
                __android_log_write(ANDROID_LOG_INFO, TAG, "js func called.");
            });
            __android_log_write(ANDROID_LOG_INFO, TAG, "finish set callback");
        } else {
            __android_log_write(ANDROID_LOG_INFO, TAG, "unset.");
            // second parameter omitted or undefined, so remove callback
            mediaPlayer->unsetSampleBufferCallback();
        }

        __android_log_write(ANDROID_LOG_INFO, TAG, "finish.");
        return jsi::Value::undefined();
    };
    runtime.global().setProperty(runtime,
                                 "__av_sound_setOnAudioSampleReceivedCallback",
                                 jsi::Function::createFromHostFunction(runtime,
                                                                       jsi::PropNameID::forAscii(runtime, "__av_sound_setOnAudioSampleReceivedCallback"),
                                                                       2,
                                                                       function));
}

} // namespace expo
