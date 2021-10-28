// Copyright 2017-present 650 Industries. All rights reserved.
#pragma once

#import <AVFoundation/AVFoundation.h>

//#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/TurboModuleUtils.h>

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
using CallbackWrapper = facebook::react::CallbackWrapper;
using CallInvoker = facebook::react::CallInvoker;

class AudioSampleCallbackWrapper
{
  std::weak_ptr<CallbackWrapper> weakWrapper;
//  jsi::Function callback_;
//  jsi::Runtime &runtime_;
//  std::shared_ptr<CallInvoker> jsInvoker_;
public:
  AudioSampleCallbackWrapper(jsi::Function &&callback,
                             jsi::Runtime &runtime,
                             std::shared_ptr<CallInvoker> jsInvoker)
  : weakWrapper(CallbackWrapper::createWeak(std::move(callback), runtime, jsInvoker))
//  : callback_(std::move(callback)),
//    runtime_(runtime),
//    jsInvoker_(std::move(jsInvoker))
  {}
  
  ~AudioSampleCallbackWrapper() {
    auto strongWrapper = weakWrapper.lock();
    if (strongWrapper) {
      strongWrapper->destroy();
    }
  }
  
  void call(AudioBuffer* buffer, double timestamp);
};

