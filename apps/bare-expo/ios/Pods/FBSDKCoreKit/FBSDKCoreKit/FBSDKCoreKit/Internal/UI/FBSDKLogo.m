// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKLogo.h"

@implementation FBSDKLogo

- (CGPathRef)pathWithSize:(CGSize)size
{
    CGFloat originalCanvasWidth = 1366;
    CGFloat originalCanvasHeight = 1366;

    CGAffineTransform transformValue = CGAffineTransformMakeScale(size.width / originalCanvasWidth, size.height / originalCanvasHeight);

    UIBezierPath* path = [UIBezierPath bezierPath];
    [path moveToPoint: CGPointMake(1365.33, 682.67)];
    [path addCurveToPoint: CGPointMake(682.67, -0)
                  controlPoint1: CGPointMake(1365.33, 305.64)
                  controlPoint2: CGPointMake(1059.69, -0)];
    [path addCurveToPoint: CGPointMake(0, 682.67)
                  controlPoint1: CGPointMake(305.64, -0)
                  controlPoint2: CGPointMake(0, 305.64)];
    [path addCurveToPoint: CGPointMake(576, 1357.04)
                  controlPoint1: CGPointMake(0, 1023.41)
                  controlPoint2: CGPointMake(249.64, 1305.83)];
    [path addLineToPoint: CGPointMake(576, 880)];
    [path addLineToPoint: CGPointMake(402.67, 880)];
    [path addLineToPoint: CGPointMake(402.67, 682.67)];
    [path addLineToPoint: CGPointMake(576, 682.67)];
    [path addLineToPoint: CGPointMake(576, 532.27)];
    [path addCurveToPoint: CGPointMake(833.85, 266.67)
                  controlPoint1: CGPointMake(576, 361.17)
                  controlPoint2: CGPointMake(677.92, 266.67)];
    [path addCurveToPoint: CGPointMake(986.67, 280)
                  controlPoint1: CGPointMake(908.54, 266.67)
                  controlPoint2: CGPointMake(986.67, 280)];
    [path addLineToPoint: CGPointMake(986.67, 448)];
    [path addLineToPoint: CGPointMake(900.58, 448)];
    [path addCurveToPoint: CGPointMake(789.33, 554.61)
                  controlPoint1: CGPointMake(815.78, 448)
                  controlPoint2: CGPointMake(789.33, 500.62)];
    [path addLineToPoint: CGPointMake(789.33, 682.67)];
    [path addLineToPoint: CGPointMake(978.67, 682.67)];
    [path addLineToPoint: CGPointMake(948.4, 880)];
    [path addLineToPoint: CGPointMake(789.33, 880)];
    [path addLineToPoint: CGPointMake(789.33, 1357.04)];
    [path addCurveToPoint: CGPointMake(1365.33, 682.67)
                  controlPoint1: CGPointMake(1115.69, 1305.83)
                  controlPoint2: CGPointMake(1365.33, 1023.41)];
    [path closePath];
    [path applyTransform:transformValue];

    return [path CGPath];
}

@end
