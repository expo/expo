// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>

extern NSString * const EXAREventNameAnchorsDidUpdate;
extern NSString * const EXAREventNameDidChangeTrackingState;
extern NSString * const EXAREventNameDidFailWithError;
extern NSString * const EXAREventNameFrameDidUpdate;
extern NSString * const EXAREventNameSessionInterruptionEnded;
extern NSString * const EXAREventNameSessionWasInterrupted;

@interface EXARModule : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@end
