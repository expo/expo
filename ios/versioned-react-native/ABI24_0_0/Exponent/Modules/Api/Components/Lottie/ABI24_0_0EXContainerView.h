//
//  ABI24_0_0EXContainerView.h
//  LottieReactABI24_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//


// import ABI24_0_0RCTView.h
#if __has_include(<ReactABI24_0_0/ABI24_0_0RCTView.h>)
#import <ReactABI24_0_0/ABI24_0_0RCTView.h>
#elif __has_include("ABI24_0_0RCTView.h")
#import "ABI24_0_0RCTView.h"
#else
#import "ReactABI24_0_0/ABI24_0_0RCTView.h"
#endif

#import <Lottie/Lottie.h>

@interface ABI24_0_0EXContainerView : ABI24_0_0RCTView

@property (nonatomic, assign) BOOL loop;
@property (nonatomic, assign) CGFloat speed;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, strong) NSDictionary *sourceJson;
@property (nonatomic, strong) NSString *sourceName;

- (void)play;
- (void)reset;

@end
