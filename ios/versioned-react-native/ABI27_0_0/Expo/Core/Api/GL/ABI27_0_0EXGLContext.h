//
//  ABI27_0_0EXGLContext.h
//  Exponent
//
//  Created by Tomasz Sapeta on 11.01.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <EXGL-CPP/UEXGL.h>
#import <OpenGLES/EAGL.h>
#import "ABI27_0_0EXGLObjectManager.h"

@class ABI27_0_0EXGLContext;

@protocol ABI27_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI27_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI27_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI27_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI27_0_0EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<ABI27_0_0EXGLContextDelegate>)delegate andManager:(nonnull ABI27_0_0EXGLObjectManager *)manager;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(ABI27_0_0RCTPromiseResolveBlock)resolve reject:(ABI27_0_0RCTPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI27_0_0EXGLContextDelegate> delegate;

@end
