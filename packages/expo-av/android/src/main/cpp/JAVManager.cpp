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

    auto function = [this, callInvoker](jsi::Runtime &runtime,
                                        const jsi::Value &thisValue,
                                        const jsi::Value *args,
                                        size_t argsCount) -> jsi::Value {
        auto playerId = args[0].asNumber();

        auto mediaPlayer = getMediaPlayerById(static_cast<int>(playerId));
        if (mediaPlayer == nullptr) {
            auto message = "Sound Instance with ID " + std::to_string(playerId) + "does not exist!";
            throw jsi::JSError(runtime, message.c_str());
        }

        if (argsCount > 1 && args[1].isObject() && !args[1].isUndefined()) {
            // second parameter received, it's the callback function.
            __android_log_write(ANDROID_LOG_INFO, TAG, "Setting Sample Buffer Callback...");

            auto callback = args[1].asObject(runtime).asFunction(runtime);
            auto callbackShared = std::make_shared<jsi::Function>(std::move(callback));

            mediaPlayer->setSampleBufferCallback([callbackShared, &runtime, callInvoker](jni::alias_ref<jni::JArrayByte> sampleBuffer)  {
                auto channelsCount = /* TODO: channelsCount */ 1;
                auto size = sampleBuffer->size();

                // copies the JNI array into a vector and reinterprets it as an unsigned 8 bit int (u_byte)
                std::vector<uint8_t> buffer(size);
                sampleBuffer->getRegion(0, size, (int8_t*)buffer.data());

                // TODO: Run per channel instead of flat array?
                auto channels = jsi::Array(runtime, channelsCount);
                for (auto i = 0; i < channelsCount; i++) {
                    auto channel = jsi::Object(runtime);

                    auto frames = jsi::Array(runtime, size);

                    for (size_t ii = 0; ii < size; ii++) {
                        // `buffer` is interpreted as a 8-bit signed integer (byte), but the waveform
                        // output is actually 8-bit unsigned integer (u_byte), so we reinterpret as that
                        // and then divide it by 256 to normalize it to a -1.0 to 1.0 scale.
                        double frame = ((double)buffer[ii] - 128) / 128.0;
                        frames.setValueAtIndex(runtime, ii, jsi::Value(frame));
                    }

                    channel.setProperty(runtime, "frames", frames);
                    channels.setValueAtIndex(runtime, i, channel);
                }

                auto sample = std::make_shared<jsi::Object>(runtime);
                sample->setProperty(runtime, "channels", channels);
                sample->setProperty(runtime, "timestamp", jsi::Value(13));

                callInvoker->invokeAsync([callbackShared, &runtime, sample = std::move(sample)] () {
                    try {
                        jsi::Object* s = sample.get();
                        callbackShared->call(runtime, std::move(*s));
                    } catch (std::exception &exception) {
                        auto message = "Sample Buffer Callback threw an error: " + std::string(exception.what());
                        __android_log_write(ANDROID_LOG_ERROR, TAG, message.c_str());
                    }
                });
            });
        } else {
            // second parameter omitted or undefined, so remove callback
            __android_log_write(ANDROID_LOG_INFO, TAG, "Unsetting Sample Buffer Callback...");

            mediaPlayer->unsetSampleBufferCallback();
        }

        __android_log_write(ANDROID_LOG_INFO, TAG, "Finished.");
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
