//
//  EXContainerView.h
//  LottieReactNative
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import RCTView.h
#if __has_include(<React/RCTView.h>)
#import <React/RCTView.h>
#elif __has_include("RCTView.h")
#import "RCTView.h"
#else
#import "React/RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface EXContainerView : RCTView

@property (nonatomic, assign) BOOL loop;
@property (nonatomic, assign) CGFloat speed;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, strong) NSDictionary *sourceJson;
@property (nonatomic, strong) NSString *sourceName;
@property (nonatomic, copy) RCTBubblingEventBlock onAnimationFinish;

- (void)play;
- (void)play:(nullable LOTAnimationCompletionBlock)completion;
- (void)playFromFrame:(NSNumber *)startFrame
              toFrame:(NSNumber *)endFrame
       withCompletion:(nullable LOTAnimationCompletionBlock)completion;
- (void)reset;

@end
