//
//  LOTShapeRepeater.h
//  Lottie
//
//  Created by brandon_withrow on 7/28/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

NS_ASSUME_NONNULL_BEGIN

@interface LOTShapeRepeater : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *copies;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *offset;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *anchorPoint;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *scale;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *position;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *rotation;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *startOpacity;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *endOpacity;

@end

NS_ASSUME_NONNULL_END
