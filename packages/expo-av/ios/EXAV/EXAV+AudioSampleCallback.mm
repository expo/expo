// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>
#import "EXAV.h"
#import <EXAV/EXAVPlayerData.h>

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

@implementation EXAV (AudioSampleCallback)

- (void) installJSIBindingsForRuntime:(void *)jsRuntimePtr
                  withSoundDictionary:(NSMutableDictionary <NSNumber *, EXAVPlayerData *> *)soundDictionary
{
  auto& runtime = *static_cast<jsi::Runtime*>(jsRuntimePtr);

  __weak auto weakSoundDictionary = soundDictionary;
  auto setAudioSampleCallback = [weakSoundDictionary](jsi::Runtime &runtime,
                                                      const jsi::Value &thisValue,
                                                      const jsi::Value *args,
                                                      size_t argsCount) -> jsi::Value {
    auto strongSoundDictionary = weakSoundDictionary;
    if (!strongSoundDictionary) {
      throw jsi::JSError(runtime, "Failed to strongify sound dictionary!");
    }

    auto avId = static_cast<int>(args[0].asNumber());

    auto sound = [strongSoundDictionary objectForKey:@(avId)];
    if (sound == nil) {
      auto message = [NSString stringWithFormat:@"Sound Instance with ID %i does not exist!", avId];
      throw jsi::JSError(runtime, message.UTF8String);
    }

    if (argsCount > 1 && args[1].isObject()) {
      // second parameter received, it's the callback function.
      __block auto callback = args[1].asObject(runtime).asFunction(runtime);

      [sound addSampleBufferCallback:^(AudioBuffer *buffer, double timestamp) {
        auto channelsCount = (size_t) buffer->mNumberChannels;
        auto framesCount = buffer->mDataByteSize / sizeof(float);
        float *data = (float *) buffer->mData;

        // TODO: Avoid copy by directly using ArrayBuffer?
        auto channels = jsi::Array(runtime, channelsCount);
        // Channels in AudioBuffer are interleaved, so for `2` channels we do steps of `2`. ([0, 2, 4, 6, ...] and [1, 3, 5, 7, ...])
        for (auto channelIndex = 0; channelIndex < channelsCount; channelIndex++) {
          auto channel = jsi::Object(runtime);

          auto frames = jsi::Array(runtime, framesCount);
          // Start at the channel offset (0, 1, ...) and increment by channel count (interleaved jump),
          //    so for 2 channels we run [0, 2, 4, ..] and [1, 3, 5, ..]
          //    and for 1 channel we run [0, 1, 2, ..]
          for (auto frameIndex = channelIndex; frameIndex < framesCount; frameIndex += channelsCount) {
            double frame = (double) data[frameIndex];
            frames.setValueAtIndex(runtime, frameIndex, jsi::Value(frame));
          }

          channel.setProperty(runtime, "frames", frames);
          channels.setValueAtIndex(runtime, channelIndex, channel);
        }

        auto sample = jsi::Object(runtime);
        sample.setProperty(runtime, "channels", channels);
        sample.setProperty(runtime, "timestamp", jsi::Value(timestamp));
        callback.call(runtime, sample);
      }];
    } else {
      // second parameter omitted or undefined, so remove callback
      [sound removeSampleBufferCallback];
    }

    return jsi::Value::undefined();
  };

  runtime.global().setProperty(runtime,
                               "__EXAV_setOnAudioSampleReceivedCallback",
                               jsi::Function::createFromHostFunction(runtime,
                                                                     jsi::PropNameID::forUtf8(runtime, "__EXAV_setOnAudioSampleReceivedCallback"),
                                                                     2, // [AV-Instance ID, Callback]
                                                                     std::move(setAudioSampleCallback)));
}

@end
