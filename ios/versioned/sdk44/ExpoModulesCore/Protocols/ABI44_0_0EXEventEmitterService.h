// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>

@protocol ABI44_0_0EXEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
