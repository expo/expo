//
//  ABI31_0_0EXContainerView.h
//  LottieReactABI31_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import ABI31_0_0RCTView.h
#if __has_include(<ReactABI31_0_0/ABI31_0_0RCTView.h>)
#import <ReactABI31_0_0/ABI31_0_0RCTView.h>
#elif __has_include("ABI31_0_0RCTView.h")
#import "ABI31_0_0RCTView.h"
#else
#import "ReactABI31_0_0/ABI31_0_0RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface ABI31_0_0EXContainerView : ABI31_0_0RCTView

@property (nonatomic, assign) BOOL loop;
@property (nonatomic, assign) CGFloat speed;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, strong) NSDictionary *sourceJson;
@property (nonatomic, strong) NSString *sourceName;

- (void)play;
- (void)playFromFrame:(NSNumber *)startFrame
              toFrame:(NSNumber *)endFrame;
- (void)reset;

@end
