// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <UMCore/UMAppLifecycleListener.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, UnimodulesCameraState) {
  UnimodulesCameraStateNoCameraAccess,
  UnimodulesCameraStateInitialized,
  UnimodulesCameraStateRunning,
  UnimodulesCameraStateConfigurationFailed,
};

@interface EXCamera2View : UIView <UMAppLifecycleListener>

@property (nonatomic, assign) NSInteger autofocus;
@property (nonatomic, assign) NSInteger facing;
@property (nonatomic, assign) NSInteger flashMode;
@property (nonatomic, assign) CGFloat focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (nonatomic, assign) CGFloat zoom;

- (void)pausePreviewWithCompletion:(void (^_Nullable)(_Nullable id result))onSuccess
                          andError:(void (^_Nullable)(NSString * _Nonnull message, NSError * _Nullable error))onError;
- (void)resumePreviewWithCompletion:(void (^_Nullable)(_Nullable id result))onSuccess
                           andError:(void (^_Nullable)(NSString * _Nonnull message, NSError * _Nullable error))onError;;


@end

NS_ASSUME_NONNULL_END
