// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMExportedModule.h>

@protocol UMEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
