// Copyright 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>
#import <EXAV/EXAV.h>
#import <EXAV/EXAVPlayerData.h>

#import <ReactCommon/RCTTurboModuleManager.h>

#import <jsi/jsi.h>

#import "EXAudioSampleCallback.h"
#import "AudioSampleCallbackWrapper.h"

namespace jsi = facebook::jsi;
using CallInvoker = facebook::react::CallInvoker;

static constexpr auto globalJsFuncName = "__EXAV_setOnAudioSampleReceivedCallback";

@implementation EXAV (AudioSampleCallback)

- (void) installJSIBindingsForRuntime:(void *)jsRuntimePtr
                  withSoundDictionary:(NSMutableDictionary <NSNumber *, EXAVPlayerData *> *)soundDictionary
{
  __weak auto weakCallInvoker = self.bridge.jsCallInvoker;
  __weak auto weakSoundDictionary = soundDictionary;
  
  auto setAudioSampleCallback = [weakCallInvoker, weakSoundDictionary](jsi::Runtime &runtime,
                                                      const jsi::Value &thisValue,
                                                      const jsi::Value *args,
                                                      size_t argsCount) -> jsi::Value {
    auto strongSoundDictionary = weakSoundDictionary;
    auto strongCallInvoker = weakCallInvoker;
    
    if (!strongSoundDictionary) {
      throw jsi::JSError(runtime, "Failed to strongify sound dictionary!");
    }
    
    if (!strongCallInvoker) {
      throw jsi::JSError(runtime, "Failed to strongify call invoker!");
    }

    auto avId = static_cast<int>(args[0].asNumber());

    auto sound = [strongSoundDictionary objectForKey:@(avId)];
    if (sound == nil) {
      auto message = [NSString stringWithFormat:@"Sound Instance with ID %i does not exist!", avId];
      throw jsi::JSError(runtime, message.UTF8String);
    }

    if (argsCount > 1 && args[1].isObject()) {
      // second parameter received, it's the callback function.
      auto callback = args[1].asObject(runtime).asFunction(runtime);
      
      auto wrapper = new AudioSampleCallbackWrapper(std::move(callback), runtime, strongCallInvoker);
      EXAudioSampleCallback* objcWrapper = [[EXAudioSampleCallback alloc] initWithWrapper:wrapper];
      [sound setSampleBufferCallback:objcWrapper];
      NSLog(@"Callback set");
    } else {
      // second parameter omitted or undefined, so remove callback
      [sound setSampleBufferCallback:nil];
      NSLog(@"Callback unset");
    }

    return jsi::Value::undefined();
  };

  auto& runtime = *reinterpret_cast<jsi::Runtime*>(jsRuntimePtr);
  runtime
    .global()
    .setProperty(runtime,
                 globalJsFuncName,
                 jsi::Function::createFromHostFunction(runtime,
                                                       jsi::PropNameID::forUtf8(runtime, globalJsFuncName),
                                                       2, // two parameters: AV-Instance ID, Callback
                                                       std::move(setAudioSampleCallback)));
}

@end
