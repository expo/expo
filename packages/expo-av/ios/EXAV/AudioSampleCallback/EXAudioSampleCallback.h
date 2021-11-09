// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#ifdef __cplusplus
#import <EXAV/AudioSampleCallbackWrapper.h>
#endif

// Objective-C holder for a C++ callback class
@interface EXAudioSampleCallback : NSObject

#ifdef __cplusplus
- (id)initWithCallbackWrapper:(std::unique_ptr<expo::av::AudioSampleCallbackWrapper>)wrapper;
#endif

- (void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp;
@end

