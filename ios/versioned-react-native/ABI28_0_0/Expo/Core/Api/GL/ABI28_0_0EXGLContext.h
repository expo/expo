//
//  ABI28_0_0EXGLContext.h
//  Exponent
//
//  Created by Tomasz Sapeta on 11.01.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>
#import <EXGL-CPP/UEXGL.h>
#import <OpenGLES/EAGL.h>
#import "ABI28_0_0EXGLObjectManager.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI28_0_0EXGLContext;

@protocol ABI28_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI28_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI28_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI28_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI28_0_0EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<ABI28_0_0EXGLContextDelegate>)delegate andManager:(nonnull ABI28_0_0EXGLObjectManager *)manager;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(ABI28_0_0RCTPromiseResolveBlock)resolve reject:(ABI28_0_0RCTPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI28_0_0EXGLContextDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
