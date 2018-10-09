// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXDefines.h>
#import <EXCore/EXExportedModule.h>

// Implement this protocol in your exported module to be able
// to send events through platform event emitter.

@protocol EXEventEmitter

- (void)startObserving;
- (void)stopObserving;

- (NSArray<NSString *> *)supportedEvents;

@end
