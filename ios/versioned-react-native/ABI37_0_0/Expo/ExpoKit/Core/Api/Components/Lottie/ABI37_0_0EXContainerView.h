//
//  ABI37_0_0EXContainerView.h
//  LottieABI37_0_0ReactNative
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import ABI37_0_0RCTView.h
#if __has_include(<ABI37_0_0React/ABI37_0_0RCTView.h>)
#import <ABI37_0_0React/ABI37_0_0RCTView.h>
#elif __has_include("ABI37_0_0RCTView.h")
#import "ABI37_0_0RCTView.h"
#else
#import "ABI37_0_0React/ABI37_0_0RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface ABI37_0_0EXContainerView : ABI37_0_0RCTView

@property (nonatomic, assign) BOOL loop;
@property (nonatomic, assign) CGFloat speed;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, strong) NSDictionary *sourceJson;
@property (nonatomic, strong) NSString *sourceName;
@property (nonatomic, copy) ABI37_0_0RCTBubblingEventBlock onAnimationFinish;

- (void)play;
- (void)play:(nullable LOTAnimationCompletionBlock)completion;
- (void)playFromFrame:(NSNumber *)startFrame
              toFrame:(NSNumber *)endFrame
       withCompletion:(nullable LOTAnimationCompletionBlock)completion;
- (void)reset;

@end
