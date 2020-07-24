// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMDefines.h>
#import <EDUMExportedModule.h>

@protocol EDUMEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
