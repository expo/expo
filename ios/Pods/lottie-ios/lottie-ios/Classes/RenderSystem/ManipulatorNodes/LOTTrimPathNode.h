//
//  LOTTrimPathNode.h
//  Lottie
//
//  Created by brandon_withrow on 7/21/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTAnimatorNode.h"
#import "LOTShapeTrimPath.h"

@interface LOTTrimPathNode : LOTAnimatorNode

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                                  trimPath:(LOTShapeTrimPath *_Nonnull)trimPath;

@end
