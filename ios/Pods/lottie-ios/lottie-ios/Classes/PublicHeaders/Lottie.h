//
//  Lottie.h
//  Pods
//
//  Created by brandon_withrow on 1/27/17.
//
//  Dream Big.

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#ifndef Lottie_h
#define Lottie_h

//! Project version number for Lottie.
FOUNDATION_EXPORT double LottieVersionNumber;

//! Project version string for Lottie.
FOUNDATION_EXPORT const unsigned char LottieVersionString[];

#include <TargetConditionals.h>

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR
#import "LOTAnimationTransitionController.h"
#import "LOTAnimatedSwitch.h"
#import "LOTAnimatedControl.h"
#endif

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR
#import "LOTCacheProvider.h"
#endif

#import "LOTAnimationView.h"
#import "LOTAnimationCache.h"
#import "LOTComposition.h"
#import "LOTBlockCallback.h"
#import "LOTInterpolatorCallback.h"
#import "LOTValueCallback.h"
#import "LOTValueDelegate.h"

#endif /* Lottie_h */
