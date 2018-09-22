//
//  LOTShapeTransform.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/15/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <QuartzCore/QuartzCore.h>
#import "LOTKeyframe.h"

@interface LOTShapeTransform : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) LOTKeyframeGroup *position;
@property (nonatomic, readonly) LOTKeyframeGroup *anchor;
@property (nonatomic, readonly) LOTKeyframeGroup *scale;
@property (nonatomic, readonly) LOTKeyframeGroup *rotation;
@property (nonatomic, readonly) LOTKeyframeGroup *opacity;

@end
