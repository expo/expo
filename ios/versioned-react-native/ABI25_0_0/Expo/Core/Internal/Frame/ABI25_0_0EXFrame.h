// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI25_0_0/ABI25_0_0RCTView.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI25_0_0EXFrame : ABI25_0_0RCTView

@property (nonatomic, strong, nullable) NSURL *initialUri;
@property (nonatomic, strong, nullable) NSURL *source;
@property (nonatomic, strong, nullable) NSString *applicationKey DEPRECATED_ATTRIBUTE; // TODO: remove when we move above sdk 5.0.0
@property (nonatomic, strong, nullable) NSString *debuggerHostname;
@property (nonatomic, assign) NSInteger debuggerPort;
@property (nonatomic, strong, nullable) NSDictionary *manifest;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)coder NS_UNAVAILABLE;

- (void)reload;

@end

NS_ASSUME_NONNULL_END
