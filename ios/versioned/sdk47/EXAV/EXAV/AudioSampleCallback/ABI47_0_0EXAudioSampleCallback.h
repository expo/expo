// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#ifdef __cplusplus
#import <ABI47_0_0EXAV/AudioSampleCallbackWrapper.h>
#endif

// Objective-C holder for a C++ callback class
@interface ABI47_0_0EXAudioSampleCallback : NSObject

#ifdef __cplusplus
- (id)initWithCallbackWrapper:(std::unique_ptr<ABI47_0_0expo::av::AudioSampleCallbackWrapper>)wrapper;
#endif

- (void)callWithAudioBuffer:(AudioBuffer*)buffer andTimestamp:(double)timestamp;
@end

