// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>

// Implement this protocol in your exported module to be able
// to send events through platform event emitter.

@protocol ABI44_0_0EXEventEmitter

- (void)startObserving;
- (void)stopObserving;

- (NSArray<NSString *> *)supportedEvents;

@end
