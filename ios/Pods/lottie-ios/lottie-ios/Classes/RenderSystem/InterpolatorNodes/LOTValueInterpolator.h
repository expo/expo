//
//  LOTValueInterpolator.h
//  Pods
//
//  Created by brandon_withrow on 7/10/17.
//
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"
#import "LOTValueDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface LOTValueInterpolator : NSObject

- (instancetype)initWithKeyframes:(NSArray <LOTKeyframe *> *)keyframes;

@property (nonatomic, weak, nullable) LOTKeyframe *leadingKeyframe;
@property (nonatomic, weak, nullable) LOTKeyframe *trailingKeyframe;
@property (nonatomic, readonly) BOOL hasDelegateOverride;

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate;

- (BOOL)hasUpdateForFrame:(NSNumber *)frame;
- (CGFloat)progressForFrame:(NSNumber *)frame;

@end

NS_ASSUME_NONNULL_END
