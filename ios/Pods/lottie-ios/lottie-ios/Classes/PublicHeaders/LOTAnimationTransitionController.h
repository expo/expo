//
//  LOTAnimationTransitionController.h
//  Lottie
//
//  Created by Brandon Withrow on 1/18/17.
//  Copyright © 2017 Brandon Withrow. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

/** LOTAnimationTransitionController
 *
 *  This class creates a custom UIViewController transition animation
 *  using a Lottie animation to transition between two view controllers
 *  The transition can use custom defined layers in After Effects for to/from
 *
 *  When referencing After Effects layers the animator masks or transforms the to/from viewController
 *  with the referenced layer.
 *
 */

@interface LOTAnimationTransitionController : NSObject <UIViewControllerAnimatedTransitioning>

/**
 The initializer to create a new transition animation.
 
 @param animation The name of the Lottie Animation to load for the transition
 
 @param fromLayer The name of the custom layer to mask the fromVC screenshot with.
 If no layer is specified then the screenshot is added behind the Lottie Animation
 
 @param toLayer The name of the custom layer to mask the toVC screenshot with.
 If no layer is specified then the screenshot is added behind the Lottie Animation
 and a fade transition is performed along with the Lottie animation.
 
 @param applyAnimationTransform A boolean that determines if the custom layer should
 have the transform animation from the After Effects layer applied to it. If NO the
 layer will be masked by the After Effects Layer
 
 */
- (nonnull instancetype)initWithAnimationNamed:(nonnull NSString *)animation
                                fromLayerNamed:(nullable NSString *)fromLayer
                                  toLayerNamed:(nullable NSString *)toLayer
                       applyAnimationTransform:(BOOL)applyAnimationTransform;

/**
 The initializer to create a new transition animation.
 
 @param animation The name of the Lottie Animation to load for the transition
 
 @param fromLayer The name of the custom layer to mask the fromVC screenshot with.
 If no layer is specified then the screenshot is added behind the Lottie Animation
 
 @param toLayer The name of the custom layer to mask the toVC screenshot with.
 If no layer is specified then the screenshot is added behind the Lottie Animation
 and a fade transition is performed along with the Lottie animation.
 
 @param applyAnimationTransform A boolean that determines if the custom layer should
 have the transform animation from the After Effects layer applied to it. If NO the
 layer will be masked by the After Effects Layer
 
 @param bundle custom bundle to load animation and images, if no bundle is specified will load
 from mainBundle
 */
- (instancetype _Nonnull)initWithAnimationNamed:(NSString *_Nonnull)animation
                                  fromLayerNamed:(NSString *_Nullable)fromLayer
                                    toLayerNamed:(NSString *_Nullable)toLayer
                         applyAnimationTransform:(BOOL)applyAnimationTransform
                                        inBundle:(NSBundle *_Nonnull)bundle;

@end

