// Copyright 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>
#import "EXAV.h"
#import <EXAV/EXAVPlayerData.h>

#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/TurboModuleUtils.h>

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
using CallbackWrapper = facebook::react::CallbackWrapper;
using CallInvoker = facebook::react::CallInvoker;

static constexpr auto globalJsFuncName = "__EXAV_setOnAudioSampleReceivedCallback";

class AudioSampleCallbackWrapper
{
  std::weak_ptr<CallbackWrapper> weakWrapper;
public:
  AudioSampleCallbackWrapper(jsi::Function &&callback,
                             jsi::Runtime &runtime,
                             std::shared_ptr<CallInvoker> jsInvoker)
  : weakWrapper(CallbackWrapper::createWeak(std::move(callback), runtime, jsInvoker))
  {}
  
  ~AudioSampleCallbackWrapper() {
    auto strongWrapper = weakWrapper.lock();
    if (strongWrapper) {
      strongWrapper->destroy();
    }
  }
  
  void call(AudioBuffer* buffer, double timestamp);
};

void AudioSampleCallbackWrapper::call(AudioBuffer* buffer, double timestamp)
{
  auto strongWrapper = this->weakWrapper.lock();
  if (!strongWrapper) {
    return;
  }
  
  // We need to invoke the callback from the JS thread, otherwise Hermes complains
  strongWrapper->jsInvoker().invokeAsync([buffer, this, timestamp]{
    auto callbackWrapper = this->weakWrapper.lock();
    if (!callbackWrapper) {
      return;
    }
    
    auto &rt = callbackWrapper->runtime();
    
    auto channelsCount = (size_t) buffer->mNumberChannels;
    auto framesCount = buffer->mDataByteSize / sizeof(float);
    float *data = (float *) buffer->mData;
    if (!data) {
      return;
    }

    auto channels = jsi::Array(rt, channelsCount);
    
    // Channels in AudioBuffer are interleaved, so for 2 channels we do steps of 2:
    // [0, 2, 4, 6, ...] and [1, 3, 5, 7, ...]
    for (auto channelIndex = 0; channelIndex < channelsCount; channelIndex++)
    {
      auto channel = jsi::Object(rt);
      auto frames = jsi::Array(rt, static_cast<int>(framesCount / channelsCount));
      
      for (int frameIndex = channelIndex, arrayIndex = 0;
           frameIndex < framesCount;
           frameIndex += channelsCount, arrayIndex++)
      {
        double frame = static_cast<double>(data[frameIndex]);
        frames.setValueAtIndex(rt, arrayIndex, jsi::Value(frame));
      }

      channel.setProperty(rt, "frames", frames);
      channels.setValueAtIndex(rt, channelIndex, channel);
    }

    auto sample = jsi::Object(rt);
    sample.setProperty(rt, "channels", channels);
    sample.setProperty(rt, "timestamp", jsi::Value(timestamp));

    callbackWrapper->callback().call(rt, sample);
  });
}

@implementation EXAudioSampleCallback
{
  AudioSampleCallbackWrapper * _cb;
}

-(id)initWithWrapper:(AudioSampleCallbackWrapper*)wrapper {
  self = [super init];
  _cb = wrapper;
  return self;
}

-(void)dealloc {
  delete _cb;
}

-(void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp
{
  if (_cb != NULL)
  {
    _cb->call(buffer, timestamp);
  }
}

@end


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
      
      auto wrapper = new AudioSampleCallbackWrapper(callback.getFunction(runtime), runtime, strongCallInvoker);
      EXAudioSampleCallback* objcWrapper = [[EXAudioSampleCallback alloc] initWithWrapper:wrapper];
      [sound setSampleBufferCallback:objcWrapper];
    } else {
      // second parameter omitted or undefined, so remove callback
      [sound setSampleBufferCallback:nil];
    }

    return jsi::Value::undefined();
  };

  auto& runtime = *static_cast<jsi::Runtime*>(jsRuntimePtr);
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
