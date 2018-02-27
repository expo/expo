// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorView.h"

#import <React/RCTBridge.h>

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface EXViewController : UIViewController

- (instancetype)initWithLaunchOptions: (NSDictionary *)launchOptions;
- (void)loadReactApplication;
- (void)showErrorWithType:(EXFatalErrorType)type error: (nullable NSError *)error;
- (NSDictionary *)launchOptions;

// TODO: make private
@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, strong) UIView *contentView;

@end

NS_ASSUME_NONNULL_END
