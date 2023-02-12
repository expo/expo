// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>

@protocol ABI46_0_0EXEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
