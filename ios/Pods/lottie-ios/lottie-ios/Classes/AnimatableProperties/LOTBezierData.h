//
//  LOTBezierData.h
//  Lottie
//
//  Created by brandon_withrow on 7/10/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

NS_ASSUME_NONNULL_BEGIN

@interface LOTBezierData : NSObject

- (instancetype)initWithData:(NSDictionary *)bezierData;

@property (nonatomic, readonly) NSInteger count;
@property (nonatomic, readonly) BOOL closed;

- (CGPoint)vertexAtIndex:(NSInteger)index;
- (CGPoint)inTangentAtIndex:(NSInteger)index;
- (CGPoint)outTangentAtIndex:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
