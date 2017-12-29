// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTView.h>
#import <React/RCTEventDispatcher.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFrame : RCTView

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
