//
//  ABI48_0_0AIRGoogleMapCallout.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapCallout.h"
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

@implementation ABI48_0_0AIRGoogleMapCallout

- (BOOL) isPointInside:(CGPoint)pointInCallout {
    if (!self.alphaHitTest)
        return TRUE;
    CGFloat alpha = [self alphaOfPoint:pointInCallout];
    return alpha >= 0.01;
}

- (CGFloat) alphaOfPoint:(CGPoint)point {
    unsigned char pixel[4] = {0};
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(pixel, 1, 1, 8, 4, colorSpace, kCGBitmapAlphaInfoMask & kCGImageAlphaPremultipliedLast);
    CGContextTranslateCTM(context, -point.x, -point.y);
    [self.layer renderInContext:context];
    CGContextRelease(context);
    CGColorSpaceRelease(colorSpace);
    return pixel[3]/255.0;
}


@end

#endif
