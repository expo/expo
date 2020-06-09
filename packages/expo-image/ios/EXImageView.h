// Copyright 2020-present 650 Industries. All rights reserved.

#import <SDWebImage/SDWebImage.h>
#import <expo-image/EXImageView.h>
#import <expo-image/EXImageTypes.h>
#import <React/RCTComponent.h>
#import <React/UIView+React.h>
#import <React/RCTResizeMode.h>
#import <React/RCTBorderStyle.h>

@class RCTBridge;

@interface EXImageView : UIView

#pragma mark - Events

@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;


#pragma mark - Layout

@property (nonatomic, assign) UIUserInterfaceLayoutDirection reactLayoutDirection;


#pragma mark - Borders

@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderTopLeftRadius;
@property (nonatomic, assign) CGFloat borderTopRightRadius;
@property (nonatomic, assign) CGFloat borderTopStartRadius;
@property (nonatomic, assign) CGFloat borderTopEndRadius;
@property (nonatomic, assign) CGFloat borderBottomLeftRadius;
@property (nonatomic, assign) CGFloat borderBottomRightRadius;
@property (nonatomic, assign) CGFloat borderBottomStartRadius;
@property (nonatomic, assign) CGFloat borderBottomEndRadius;

@property (nonatomic, assign) CGColorRef borderTopColor;
@property (nonatomic, assign) CGColorRef borderRightColor;
@property (nonatomic, assign) CGColorRef borderBottomColor;
@property (nonatomic, assign) CGColorRef borderLeftColor;
@property (nonatomic, assign) CGColorRef borderStartColor;
@property (nonatomic, assign) CGColorRef borderEndColor;
@property (nonatomic, assign) CGColorRef borderColor;

@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderStartWidth;
@property (nonatomic, assign) CGFloat borderEndWidth;
@property (nonatomic, assign) CGFloat borderWidth;

@property (nonatomic, assign) RCTBorderStyle borderTopStyle;
@property (nonatomic, assign) RCTBorderStyle borderRightStyle;
@property (nonatomic, assign) RCTBorderStyle borderBottomStyle;
@property (nonatomic, assign) RCTBorderStyle borderLeftStyle;
@property (nonatomic, assign) RCTBorderStyle borderStartStyle;
@property (nonatomic, assign) RCTBorderStyle borderEndStyle;
@property (nonatomic, assign) RCTBorderStyle borderStyle;


#pragma mark - Methods

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)setSource:(NSDictionary *)sourceMap;
- (void)setResizeMode:(RCTResizeMode)resizeMode;

- (void)didSetProps:(NSArray<NSString *> *)changedProps;

@end
