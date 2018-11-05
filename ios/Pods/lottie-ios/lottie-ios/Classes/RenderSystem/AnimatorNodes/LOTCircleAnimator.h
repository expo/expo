//
//  LOTCircleAnimator.h
//  Lottie
//
//  Created by brandon_withrow on 7/19/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTAnimatorNode.h"
#import "LOTShapeCircle.h"

@interface LOTCircleAnimator : LOTAnimatorNode

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                                  shapeCircle:(LOTShapeCircle *_Nonnull)shapeCircle;

@end
