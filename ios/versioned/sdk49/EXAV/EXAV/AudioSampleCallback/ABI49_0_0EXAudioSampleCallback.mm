// Copyright 2017-present 650 Industries. All rights reserved.

#import <memory>
#import <ABI49_0_0EXAV/ABI49_0_0EXAudioSampleCallback.h>

using AudioSampleCallbackWrapper = ABI49_0_0expo::av::AudioSampleCallbackWrapper;

@implementation ABI49_0_0EXAudioSampleCallback
{
  std::unique_ptr<AudioSampleCallbackWrapper> _wrapper;
}

- (id)initWithCallbackWrapper:(std::unique_ptr<AudioSampleCallbackWrapper>)wrapper {
  self = [super init];
  _wrapper = std::move(wrapper);
  return self;
}

- (void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp
{
  if (_wrapper) {
    _wrapper->call(buffer, timestamp);
  }
}

@end
