// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXAV/EXAudioSampleCallback.h>

@implementation EXAudioSampleCallback
{
  expo::av::AudioSampleCallbackWrapper * _cb;
}

- (id)initWithCallbackWrapper:(expo::av::AudioSampleCallbackWrapper*)wrapper {
  self = [super init];
  _cb = wrapper;
  return self;
}

- (void)dealloc {
  delete _cb;
  _cb = nullptr;
}

- (void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp
{
  if (_cb != nullptr) {
    _cb->call(buffer, timestamp);
  }
}

@end
