// Copyright 2017-present 650 Industries. All rights reserved.

#include "AudioSampleCallbackWrapper.h"

std::shared_ptr<LongLivedObjectCollection> AudioSampleCallbackWrapper::callbackCollection =
  std::make_shared<LongLivedObjectCollection>();

AudioSampleCallbackWrapper::AudioSampleCallbackWrapper(jsi::Function &&callback,
                           jsi::Runtime &runtime,
                           std::shared_ptr<CallInvoker> jsInvoker)
: weakWrapper(CallbackWrapper::createWeak(callbackCollection, std::move(callback), runtime, jsInvoker)) {}

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

      channel.setProperty(rt, "frames", std::move(frames));
      channels.setValueAtIndex(rt, channelIndex, std::move(channel));
    }

    auto sample = jsi::Object(rt);
    sample.setProperty(rt, "channels", std::move(channels));
    sample.setProperty(rt, "timestamp", jsi::Value(timestamp));

    callbackWrapper->callback().call(rt, std::move(sample));
  });
}
