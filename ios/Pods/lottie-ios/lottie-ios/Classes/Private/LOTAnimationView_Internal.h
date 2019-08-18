//
//  LOTAnimationView_Internal.h
//  Lottie
//
//  Created by Brandon Withrow on 12/7/16.
//  Copyright © 2016 Brandon Withrow. All rights reserved.
//

#import "LOTAnimationView.h"

typedef enum : NSUInteger {
  LOTConstraintTypeAlignToBounds,
  LOTConstraintTypeAlignToLayer,
  LOTConstraintTypeNone
} LOTConstraintType;

@interface LOTAnimationView () <CAAnimationDelegate>

- (CALayer * _Nullable)layerForKey:(NSString * _Nonnull)keyname;
- (NSArray * _Nonnull)compositionLayers;

@end
