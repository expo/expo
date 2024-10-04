// Copyright 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>

#import <ABI48_0_0jsi/ABI48_0_0jsi.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModuleManager.h>

#import <ABI48_0_0EXAV/ABI48_0_0EXAV.h>
#import <ABI48_0_0EXAV/ABI48_0_0EXAVPlayerData.h>
#import <ABI48_0_0EXAV/ABI48_0_0EXAudioSampleCallback.h>
#import <ABI48_0_0EXAV/AudioSampleCallbackWrapper.h>

namespace jsi = ABI48_0_0facebook::jsi;
using CallInvoker = ABI48_0_0facebook::ABI48_0_0React::CallInvoker;
using namespace ABI48_0_0expo::av;

static constexpr auto globalJsFuncName = "__EXAV_setOnAudioSampleReceivedCallback";
static constexpr auto globalDestroyHostObjectName = "__EXAV_onDestroyHostObject";

class CleanupOnDestroyHostObject : public jsi::HostObject {
 public:
  CleanupOnDestroyHostObject() {}
  virtual ~CleanupOnDestroyHostObject() {
    AudioSampleCallbackWrapper::removeAllCallbacks();
  }
  virtual jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) {
    return jsi::Value::undefined();
  }
  virtual void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) {}
  virtual std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) {
    return {};
  }
};

@implementation ABI48_0_0EXAV (AudioSampleCallback)

- (void)installJSIBindingsForRuntime:(void *)jsRuntimePtr
                 withSoundDictionary:(NSMutableDictionary <NSNumber *, ABI48_0_0EXAVPlayerData *> *)soundDictionary
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
      
      auto wrapper = std::make_unique<AudioSampleCallbackWrapper>(std::move(callback), runtime, strongCallInvoker);
      ABI48_0_0EXAudioSampleCallback* objcWrapper = [[ABI48_0_0EXAudioSampleCallback alloc] initWithCallbackWrapper:(std::move(wrapper))];
      [sound setSampleBufferCallback:objcWrapper];
    } else {
      // second parameter omitted or undefined, so remove callback
      [sound setSampleBufferCallback:nil];
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
  
  // Property `__EXAV_onDestroyHostObject` of the global object will be released when entire `jsi::Runtime`
  // is being destroyed and that will trigger destructor of `CleanupOnDestroyHostObject` class which
  // will clean up all JSI callbacks.
  runtime.global().setProperty(
           runtime,
           globalDestroyHostObjectName,
           jsi::Object::createFromHostObject(runtime, std::make_shared<CleanupOnDestroyHostObject>()));
}

@end
