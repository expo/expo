//
//  LOTShapeStar.h
//  Lottie
//
//  Created by brandon_withrow on 7/27/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

typedef enum : NSUInteger {
  LOTPolystarShapeNone,
  LOTPolystarShapeStar,
  LOTPolystarShapePolygon
} LOTPolystarShape;

@interface LOTShapeStar : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) LOTKeyframeGroup *outerRadius;
@property (nonatomic, readonly) LOTKeyframeGroup *outerRoundness;

@property (nonatomic, readonly) LOTKeyframeGroup *innerRadius;
@property (nonatomic, readonly) LOTKeyframeGroup *innerRoundness;

@property (nonatomic, readonly) LOTKeyframeGroup *position;
@property (nonatomic, readonly) LOTKeyframeGroup *numberOfPoints;
@property (nonatomic, readonly) LOTKeyframeGroup *rotation;

@property (nonatomic, readonly) LOTPolystarShape type;

@end
