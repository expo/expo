//
//  LOTShapeGradientFill.h
//  Lottie
//
//  Created by brandon_withrow on 7/26/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

NS_ASSUME_NONNULL_BEGIN

typedef enum : NSUInteger {
  LOTGradientTypeLinear,
  LOTGradientTypeRadial
} LOTGradientType;

@interface LOTShapeGradientFill : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) NSNumber *numberOfColors;
@property (nonatomic, readonly) LOTKeyframeGroup *startPoint;
@property (nonatomic, readonly) LOTKeyframeGroup *endPoint;
@property (nonatomic, readonly) LOTKeyframeGroup *gradient;
@property (nonatomic, readonly) LOTKeyframeGroup *opacity;
@property (nonatomic, readonly) BOOL evenOddFillRule;
@property (nonatomic, readonly) LOTGradientType type;

@end

NS_ASSUME_NONNULL_END
