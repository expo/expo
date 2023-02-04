// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#ifdef __cplusplus
#import <ABI48_0_0EXAV/AudioSampleCallbackWrapper.h>
#endif

// Objective-C holder for a C++ callback class
@interface ABI48_0_0EXAudioSampleCallback : NSObject

#ifdef __cplusplus
- (id)initWithCallbackWrapper:(std::unique_ptr<ABI48_0_0expo::av::AudioSampleCallbackWrapper>)wrapper;
#endif

- (void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp;
@end

