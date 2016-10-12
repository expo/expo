// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXReactAppManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXKernelReactAppManager : EXReactAppManager

- (instancetype)initWithLaunchOptions:(NSDictionary *)launchOptions;

@property (nonatomic, strong) NSDictionary * __nullable launchOptions;

+ (NSURL *)kernelBundleUrl;

@end

NS_ASSUME_NONNULL_END
