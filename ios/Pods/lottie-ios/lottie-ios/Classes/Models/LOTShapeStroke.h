//
//  LOTShapeStroke.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/15/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTKeyframe.h"

typedef enum : NSUInteger {
  LOTLineCapTypeButt,
  LOTLineCapTypeRound,
  LOTLineCapTypeUnknown
} LOTLineCapType;

typedef enum : NSUInteger {
  LOTLineJoinTypeMiter,
  LOTLineJoinTypeRound,
  LOTLineJoinTypeBevel
} LOTLineJoinType;

@interface LOTShapeStroke : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary;

@property (nonatomic, readonly) NSString *keyname;
@property (nonatomic, readonly) BOOL fillEnabled;
@property (nonatomic, readonly) LOTKeyframeGroup *color;
@property (nonatomic, readonly) LOTKeyframeGroup *opacity;
@property (nonatomic, readonly) LOTKeyframeGroup *width;
@property (nonatomic, readonly) LOTKeyframeGroup *dashOffset;
@property (nonatomic, readonly) LOTLineCapType capType;
@property (nonatomic, readonly) LOTLineJoinType joinType;

@property (nonatomic, readonly) NSArray *lineDashPattern;

@end
