//
//  ABI33_0_0EXContainerView.h
//  LottieReactABI33_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import ABI33_0_0RCTView.h
#if __has_include(<ReactABI33_0_0/ABI33_0_0RCTView.h>)
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>
#elif __has_include("ABI33_0_0RCTView.h")
#import "ABI33_0_0RCTView.h"
#else
#import "ReactABI33_0_0/ABI33_0_0RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface ABI33_0_0EXContainerView : ABI33_0_0RCTView

@property (nonatomic, assign) BOOL loop;
@property (nonatomic, assign) CGFloat speed;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, strong) NSDictionary *sourceJson;
@property (nonatomic, strong) NSString *sourceName;
@property (nonatomic, copy) ABI33_0_0RCTBubblingEventBlock onAnimationFinish;

- (void)play;
- (void)play:(nullable LOTAnimationCompletionBlock)completion;
- (void)playFromFrame:(NSNumber *)startFrame
              toFrame:(NSNumber *)endFrame
       withCompletion:(nullable LOTAnimationCompletionBlock)completion;
- (void)reset;

@end
