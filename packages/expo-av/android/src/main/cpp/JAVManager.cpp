// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

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
  namespace av {

    namespace jsi = facebook::jsi;
    namespace jni = facebook::jni;

    jni::local_ref<JAVManager::jhybriddata>
    JAVManager::initHybrid(jni::alias_ref<jhybridobject> jThis) {
      return makeCxxInstance(jThis);
    }

    void JAVManager::registerNatives() {
      registerHybrid({
                       makeNativeMethod("initHybrid", JAVManager::initHybrid),
                       makeNativeMethod("installJSIBindings", JAVManager::installJSIBindings),
                     });
    }

    JPlayerData *JAVManager::getMediaPlayerById(int id) {
      static const auto func = javaPart_->getClass()->getMethod<JPlayerData *(jint)>(
        "getMediaPlayerById");
      auto result = func(javaPart_.get(), id);
      return result->cthis();
    }

    void JAVManager::installJSIBindings(jlong jsRuntimePointer,
                                        jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {
      auto &runtime = *reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
      auto callInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

      auto function = [this, callInvoker](jsi::Runtime &runtime,
                                          const jsi::Value &thisValue,
                                          const jsi::Value *args,
                                          size_t argsCount) -> jsi::Value {
        auto playerId = args[0].asNumber();

        auto mediaPlayer = getMediaPlayerById(static_cast<int>(playerId));
        if (mediaPlayer == nullptr) {
          auto message = "Sound Instance with ID " + std::to_string(playerId) +
                         "does not exist!";
          throw jsi::JSError(runtime, message.c_str());
        }

        if (argsCount > 1 && args[1].isObject()) {
          // second parameter received, it's the callback function.
          auto message = "Setting Audio Sample Buffer Callback for Player " +
                         std::to_string(playerId) + "...";
          __android_log_write(ANDROID_LOG_INFO, TAG, message.c_str());

          auto callback = args[1].asObject(runtime).asFunction(runtime);
          auto callbackShared = std::make_shared<jsi::Function>(std::move(callback));

          mediaPlayer->setSampleBufferCallback([callbackShared, &runtime, callInvoker](
            jni::alias_ref <jni::JArrayByte> sampleBuffer, double positionSeconds) {
            auto channelsCount = /* TODO: channelsCount */ 1;
            auto size = sampleBuffer->size();

            // TODO: Avoid copy by directly using ArrayBuffer? Or accessing values in the sampleBuffer?
            // copies the JNI array (signed 8 bit int (byte)) into a vector and reinterprets it as an unsigned 8 bit int (u_byte)
            std::vector<uint8_t> buffer(size);
            sampleBuffer->getRegion(0, size, reinterpret_cast<int8_t *>(buffer.data()));

            // TODO: Run per channel instead of flat array?
            auto channels = jsi::Array(runtime, channelsCount);
            for (auto i = 0; i < channelsCount; i++) {
              auto channel = jsi::Object(runtime);

              auto frames = jsi::Array(runtime, size);

              for (size_t ii = 0; ii < size; ii++) {
                // `buffer` is interpreted as a 8-bit unsigned integer (byte), so it ranges from
                // 0 to 255. To normalize it to a -1..1 scale we subtract 128 and divide by 128.
                double frame = (static_cast<double>(buffer[ii]) - 128) / 128.0;
                frames.setValueAtIndex(runtime, ii, jsi::Value(frame));
              }

              channel.setProperty(runtime, "frames", frames);
              channels.setValueAtIndex(runtime, i, channel);
            }

            // TODO: Avoid smart pointer here? Cannot move into lambda...
            auto sample = std::make_shared<jsi::Object>(runtime);
            sample->setProperty(runtime, "channels", channels);
            sample->setProperty(runtime, "timestamp", jsi::Value(positionSeconds));

            callInvoker->invokeAsync([callbackShared, &runtime, sample]() {
              try {
                jsi::Object *s = sample.get();
                callbackShared->call(runtime, std::move(*s));
              } catch (std::exception &exception) {
                auto message = "Sample Buffer Callback threw an error: " +
                               std::string(exception.what());
                __android_log_write(ANDROID_LOG_ERROR, TAG, message.c_str());
              }
            });
          });
        } else {
          // second parameter omitted or undefined, so remove callback
          __android_log_write(ANDROID_LOG_INFO, TAG,
                              "Unsetting Sample Buffer Callback...");

          mediaPlayer->unsetSampleBufferCallback();
        }

        return jsi::Value::undefined();
      };
      runtime.global().setProperty(runtime,
                                   "__EXAV_setOnAudioSampleReceivedCallback",
                                   jsi::Function::createFromHostFunction(runtime,
                                                                         jsi::PropNameID::forAscii(
                                                                           runtime,
                                                                           "__EXAV_setOnAudioSampleReceivedCallback"),
                                                                         2,
                                                                         function));
    }

  } // namespace av
} // namespace expo
