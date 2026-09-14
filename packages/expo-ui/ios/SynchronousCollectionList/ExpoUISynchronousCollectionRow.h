// Copyright 2026-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

// Numeric height/offset cache; native layout attributes are allocated on demand.
@interface ExpoUISynchronousCollectionLayout : UICollectionViewLayout
- (void)resetMeasurements;
@end

// Experimental: all methods must be called on the main thread.
@interface ExpoUISynchronousCollectionRootPool : NSObject
- (instancetype)initWithPresenter:(NSObject *)presenter;
@end

@interface ExpoUISynchronousCollectionRow : UIView
- (instancetype)initWithPool:(ExpoUISynchronousCollectionRootPool *)pool;
- (void)configureWithRenderer:(NSString *)renderer index:(NSInteger)index revision:(NSInteger)revision;
- (CGSize)renderWithWidth:(CGFloat)width;
- (void)releaseRoot;
@end

NS_ASSUME_NONNULL_END
