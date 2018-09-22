//
//  LOTPathAnimator.h
//  Pods
//
//  Created by brandon_withrow on 6/27/17.
//
//

#import "LOTAnimatorNode.h"
#import "LOTShapePath.h"

@interface LOTPathAnimator : LOTAnimatorNode

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                                  shapePath:(LOTShapePath *_Nonnull)shapePath;

@end
