//
//  SDImageSVGNativeCoder.h
//  SDWebImageSVGNativeCoder
//
//  Created by dreampiggy on 08/01/2022.
//  Copyright (c) 2022 dreampiggy. All rights reserved.
//

#if __has_include(<SDWebImage/SDWebImage.h>)
#import <SDWebImage/SDWebImage.h>
#else
@import SDWebImage;
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 SDImageSVGNativeCoder is a SVG Native image coder.
 SVG Native is a profile of SVG 1.1 designed for interoperability with native apps and system libraries that execute outside the Web environment. see more: https://svgwg.org/specs/svg-native/
*/
@interface SDImageSVGNativeCoder : NSObject <SDImageCoder>

@property (nonatomic, class, readonly) SDImageSVGNativeCoder *sharedCoder;

@end

NS_ASSUME_NONNULL_END
