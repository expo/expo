// Copyright 2017-present 650 Industries. All rights reserved.

#import "EXAudioSampleCallback.h"

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
  _cb = nullptr;
}

-(void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp
{
  if (_cb != nullptr) {
    _cb->call(buffer, timestamp);
  }
}

@end
