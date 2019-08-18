//
//  LOTShapeFill.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/15/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

NS_ASSUME_NONNULL_BEGIN

@interface LOTShapeFill : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) BOOL fillEnabled;
@property (nonatomic, readonly) LOTKeyframeGroup *color;
@property (nonatomic, readonly) LOTKeyframeGroup *opacity;
@property (nonatomic, readonly) BOOL evenOddFillRule;

@end

NS_ASSUME_NONNULL_END
