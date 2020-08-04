/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import "SDImageHEICCoder.h"

// AVFileTypeHEIC/AVFileTypeHEIF is defined in AVFoundation via iOS 11, we use this without import AVFoundation
#define kSDUTTypeHEIC ((__bridge CFStringRef)@"public.heic")
#define kSDUTTypeHEIF ((__bridge CFStringRef)@"public.heif")
// HEIC Sequence (Animated Image)
#define kSDUTTypeHEICS ((__bridge CFStringRef)@"public.heics")

@interface SDImageHEICCoder ()

+ (BOOL)canDecodeFromHEICFormat;
+ (BOOL)canDecodeFromHEIFFormat;
+ (BOOL)canEncodeToHEICFormat;
+ (BOOL)canEncodeToHEIFFormat;

@end
