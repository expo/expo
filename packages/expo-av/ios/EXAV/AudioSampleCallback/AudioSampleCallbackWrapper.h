// Copyright 2017-present 650 Industries. All rights reserved.
#pragma once

#import <AVFoundation/AVFoundation.h>

#import "Utils/CallbackWrapper.h"

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;
using CallInvoker = facebook::react::CallInvoker;
using CallbackWrapper = exav::facebook::react::CallbackWrapper;
using LongLivedObjectCollection = exav::facebook::react::LongLivedObjectCollection;

class AudioSampleCallbackWrapper
{
  static std::shared_ptr<LongLivedObjectCollection> callbackCollection;
  
  std::weak_ptr<CallbackWrapper> weakWrapper;
public:
  AudioSampleCallbackWrapper(jsi::Function &&callback,
                             jsi::Runtime &runtime,
                             std::shared_ptr<CallInvoker> jsInvoker);
  
  ~AudioSampleCallbackWrapper() {
    auto strongWrapper = weakWrapper.lock();
    if (strongWrapper) {
      strongWrapper->destroy();
    }
  }
  
  void call(AudioBuffer* buffer, double timestamp);
  
  static void removeAllCallbacks() {
    callbackCollection->clear();
  }
};
