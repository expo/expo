// Copyright 2015-present 650 Industries. All rights reserved.

#import <UMCore/UMSingletonModule.h>
#import <EXAV/EXAV.h>

FOUNDATION_EXPORT NSString * const EXAudioSessionManagerErrorDomain;

typedef NS_ENUM(NSInteger, EXAudioSessionManagerErrorCode) {
  EXAudioSessionManagerErrorCodeNoExperienceId,
};

@interface EXAudioSessionManager : UMSingletonModule <EXAVScopedModuleDelegate>

@end

