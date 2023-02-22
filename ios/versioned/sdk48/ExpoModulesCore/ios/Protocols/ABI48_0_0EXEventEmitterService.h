// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDefines.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>

@protocol ABI48_0_0EXEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
