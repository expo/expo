//
//  LOTRepeaterRenderer.h
//  Lottie
//
//  Created by brandon_withrow on 7/28/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTRenderNode.h"
#import "LOTShapeRepeater.h"

@interface LOTRepeaterRenderer : LOTRenderNode

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                              shapeRepeater:(LOTShapeRepeater *_Nonnull)repeater;

@end
