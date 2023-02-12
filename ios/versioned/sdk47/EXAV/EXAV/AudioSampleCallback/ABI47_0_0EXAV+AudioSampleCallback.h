// Copyright 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>

#import <ABI47_0_0EXAV/ABI47_0_0EXAV.h>
#import <ABI47_0_0EXAV/ABI47_0_0EXAVPlayerData.h>

@interface ABI47_0_0EXAV (AudioSampleCallback)

- (void)installJSIBindingsForRuntime:(void *)jsRuntimePtr
                 withSoundDictionary:(NSMutableDictionary<NSNumber*, ABI47_0_0EXAVPlayerData*>*)soundDictionary;

@end
