// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <jsi/jsi.h>

// TODO: Replace this with <ReactCommon/TurboModuleUtils.h> after we upgrade to RN 0.66
#import <EXAV/CallbackWrapper.h>

namespace jsi = facebook::jsi;
using CallInvoker = facebook::react::CallInvoker;

// TODO: Replace this with just facebook::react namespace after we upgrade to RN 0.66
using JsiCallbackWrapper = expo::CallbackWrapper;
using LongLivedObjectCollection = expo::LongLivedObjectCollection;

namespace expo {
namespace av {

// A class managing lifecycle of audio sample buffer callbacks
class AudioSampleCallbackWrapper
{
  std::weak_ptr<JsiCallbackWrapper> weakWrapper;
public:
  AudioSampleCallbackWrapper(jsi::Function &&callback,
                             jsi::Runtime &runtime,
                             std::shared_ptr<CallInvoker> jsInvoker);
  
  ~AudioSampleCallbackWrapper();
  
  void call(AudioBuffer* buffer, double timestamp);
  
  // static members
public:
  // called when JS VM is destroyed to remove all JSI callback objects
  static void removeAllCallbacks() {
    callbackCollection->clear();
  }
  
private:
  static std::shared_ptr<LongLivedObjectCollection> callbackCollection;
};

} // namespace av
} // namespace expo
