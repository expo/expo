// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorView.h"
#import "EXKernelReactAppManager.h"

#import "RCTBridge.h"

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface EXViewController : UIViewController <EXReactAppManagerDelegate>

- (instancetype)initWithLaunchOptions: (NSDictionary *)launchOptions;
- (void)loadReactApplication;
- (void)showErrorWithType:(EXFatalErrorType)type error: (nullable NSError *)error;

// TODO: make private
@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) UIView *contentView;

@end

NS_ASSUME_NONNULL_END
