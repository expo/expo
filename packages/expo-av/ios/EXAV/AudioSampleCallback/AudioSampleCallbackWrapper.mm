// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXAV/AudioSampleCallbackWrapper.h>

namespace expo {
namespace av {

std::shared_ptr<LongLivedObjectCollection> AudioSampleCallbackWrapper::callbackCollection =
  std::make_shared<LongLivedObjectCollection>();

AudioSampleCallbackWrapper::AudioSampleCallbackWrapper(jsi::Function &&callback,
                           jsi::Runtime &runtime,
                           std::shared_ptr<CallInvoker> jsInvoker)
: weakWrapper(JsiCallbackWrapper::createWeak(callbackCollection, std::move(callback), runtime, jsInvoker)) {}

AudioSampleCallbackWrapper::~AudioSampleCallbackWrapper() {
  auto strongWrapper = weakWrapper.lock();
  if (strongWrapper) {
    strongWrapper->destroy();
  }
}

void AudioSampleCallbackWrapper::call(AudioBuffer* buffer, double timestamp)
{
  auto strongWrapper = this->weakWrapper.lock();
  if (!strongWrapper) {
    return;
  }

  // we want to capture only the wrapper, not the whole `this` object,
  // because it may no longer exist when the lambda is invoked
  auto weakWrapper = this->weakWrapper;
  
  // We need to invoke the callback from the JS thread, otherwise Hermes complains
  strongWrapper->jsInvoker().invokeAsync([weakWrapper, buffer, timestamp]{
    auto jsiCallbackWrapper = weakWrapper.lock();
    if (!jsiCallbackWrapper || !buffer) {
      return;
    }
    
    auto &rt = jsiCallbackWrapper->runtime();
    
    auto channelsCount = (size_t) buffer->mNumberChannels;
    auto framesCount = buffer->mDataByteSize / sizeof(float);
    float *data = reinterpret_cast<float *>(buffer->mData);
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

    jsiCallbackWrapper->callback().call(rt, std::move(sample));
  });
}

} // namespace av
} // namespace expo
