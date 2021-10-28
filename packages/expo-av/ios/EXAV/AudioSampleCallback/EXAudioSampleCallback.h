// Copyright 2017-present 650 Industries. All rights reserved.

#pragma once

#import <AVFoundation/AVFoundation.h>

#ifdef __cplusplus
#import "AudioSampleCallbackWrapper.h"
#endif

// Objective-C wrapper for a C++ callback class
@interface EXAudioSampleCallback : NSObject

#ifdef __cplusplus
-(id)initWithWrapper:(AudioSampleCallbackWrapper*)wrapper;
#endif

-(void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp;
@end

