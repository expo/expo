//
//  ABI25_0_0EXContainerView.h
//  LottieReactABI25_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import ABI25_0_0RCTView.h
#if __has_include(<ReactABI25_0_0/ABI25_0_0RCTView.h>)
#import <ReactABI25_0_0/ABI25_0_0RCTView.h>
#elif __has_include("ABI25_0_0RCTView.h")
#import "ABI25_0_0RCTView.h"
#else
#import "ReactABI25_0_0/ABI25_0_0RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface ABI25_0_0EXContainerView : ABI25_0_0RCTView

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
