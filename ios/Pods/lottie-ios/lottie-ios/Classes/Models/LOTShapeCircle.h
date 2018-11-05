//
//  LOTShapeCircle.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/15/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

NS_ASSUME_NONNULL_BEGIN

@interface LOTShapeCircle : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) LOTKeyframeGroup *position;
@property (nonatomic, readonly) LOTKeyframeGroup *size;
@property (nonatomic, readonly) BOOL reversed;

@end

NS_ASSUME_NONNULL_END
