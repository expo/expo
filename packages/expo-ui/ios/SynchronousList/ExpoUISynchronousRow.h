// Copyright 2026-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

// Experimental: all methods must be called on the main thread.
@interface ExpoUISynchronousRootPool : NSObject
- (instancetype)initWithPresenter:(NSObject *)presenter;
@end

@interface ExpoUISynchronousRow : UIView
- (instancetype)initWithPool:(ExpoUISynchronousRootPool *)pool;
- (void)configureWithRenderer:(NSString *)renderer index:(NSInteger)index revision:(NSInteger)revision;
- (CGSize)renderWithWidth:(CGFloat)width;
- (void)releaseRoot;
@end

NS_ASSUME_NONNULL_END
