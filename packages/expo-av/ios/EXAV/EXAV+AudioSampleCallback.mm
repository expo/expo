//
//  EXAV+AudioSampleCallback.mm
//  EXAV
//
//  Created by Marc Rousavy on 09.07.21.
//

#import <Foundation/Foundation.h>
#import "EXAV.h"
#import <EXAV/EXAVPlayerData.h>

#import <jsi/jsi.h>

using namespace facebook;

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
    
    NSLog(@"SET CALLBACK FOR RECORDER %i...", avId);
    auto sound = [strongSoundDictionary objectForKey:@(avId)];
    if (sound == nil) {
      auto message = [NSString stringWithFormat:@"Sound Instance with ID %i does not exist!", avId];
      throw jsi::JSError(runtime, message.UTF8String);
    }
    
    if (argsCount > 1 && args[1].isObject() && !args[1].isUndefined()) {
      // second parameter received, it's the callback function.
      auto callback = args[1].asObject(runtime).asFunction(runtime);
      auto callbackShared = std::make_shared<jsi::Function>(std::move(callback));
      
      [sound addSampleBufferCallback:^(AudioBuffer *buffer, double timestamp) {
        auto channelsCount = (size_t) buffer->mNumberChannels;
        auto framesCount = buffer->mDataByteSize;
        double *data = (double *) buffer->mData;
        
        // TODO: Avoid copy by directly using ArrayBuffer?
        auto channels = jsi::Array(runtime, channelsCount);
        for (auto i = 0; i < channelsCount; i++) {
          auto channel = jsi::Object(runtime);
          
          auto frames = jsi::Array(runtime, framesCount);
          for (auto ii = 0; ii < framesCount; ii++) {
            
            double frame = data[ii];
            frames.setValueAtIndex(runtime, ii, jsi::Value(frame));
          }
          
          channel.setProperty(runtime, "frames", frames);
          channels.setValueAtIndex(runtime, i, channel);
        }
        
        auto sample = jsi::Object(runtime);
        sample.setProperty(runtime, "channels", channels);
        sample.setProperty(runtime, "timestamp", jsi::Value(timestamp));
        callbackShared->call(runtime, sample);
      }];
    } else {
      // second parameter omitted or undefined, so remove callback
      [sound removeSampleBufferCallback];
    }
    
    return jsi::Value::undefined();
  };
  
  runtime.global().setProperty(runtime,
                               "__av_sound_setOnAudioSampleReceivedCallback",
                               jsi::Function::createFromHostFunction(runtime,
                                                                     jsi::PropNameID::forUtf8(runtime, "__av_sound_setOnAudioSampleReceivedCallback"),
                                                                     2, // [AV-Instance ID, Callback]
                                                                     std::move(setAudioSampleCallback)));
}

@end
