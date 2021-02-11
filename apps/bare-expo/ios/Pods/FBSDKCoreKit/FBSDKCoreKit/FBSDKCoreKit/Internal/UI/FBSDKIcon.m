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

#import "FBSDKIcon.h"

@implementation FBSDKIcon

#pragma mark - Public API

- (UIImage *)imageWithSize:(CGSize)size
{
  return [self imageWithSize:size scale:UIScreen.mainScreen.scale color:UIColor.whiteColor];
}

- (UIImage *)imageWithSize:(CGSize)size scale:(CGFloat)scale
{
  return [self imageWithSize:size scale:scale color:UIColor.whiteColor];
}

- (UIImage *)imageWithSize:(CGSize)size color:(UIColor *)color
{
  return [self imageWithSize:size scale:UIScreen.mainScreen.scale color:color];
}

- (UIImage *)imageWithSize:(CGSize)size scale:(CGFloat)scale color:(UIColor *)color
{
  if ((size.width == 0) || (size.height == 0)) {
    return nil;
  }
  UIGraphicsBeginImageContextWithOptions(size, NO, scale);
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGPathRef path = [self pathWithSize:size];
  CGContextAddPath(context, path);
  CGContextSetFillColorWithColor(context, color.CGColor);
  CGContextFillPath(context);
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

- (CGPathRef)pathWithSize:(CGSize)size
{
  return NULL;
}

@end
