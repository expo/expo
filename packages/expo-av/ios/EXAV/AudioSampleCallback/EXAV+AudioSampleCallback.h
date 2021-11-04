// Copyright 2021-present 650 Industries, Inc. (aka Expo)

#import <Foundation/Foundation.h>

#import <EXAV/EXAV.h>
#import <EXAV/EXAVPlayerData.h>

@interface EXAV (AudioSampleCallback)

- (void)installJSIBindingsForRuntime:(void *)jsRuntimePtr
                 withSoundDictionary:(NSMutableDictionary<NSNumber*, EXAVPlayerData*>*)soundDictionary;

@end
