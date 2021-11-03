// Copyright 2017-present 650 Industries. All rights reserved.

#import <memory>
#import <EXAV/EXAudioSampleCallback.h>

using AudioSampleCallbackWrapper = expo::av::AudioSampleCallbackWrapper;

@implementation EXAudioSampleCallback
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
