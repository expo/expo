// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMExportedModule.h>

// Implement this protocol in your exported module to be able
// to send events through platform event emitter.

@protocol UMEventEmitter

- (void)startObserving;
- (void)stopObserving;

- (NSArray<NSString *> *)supportedEvents;

@end
