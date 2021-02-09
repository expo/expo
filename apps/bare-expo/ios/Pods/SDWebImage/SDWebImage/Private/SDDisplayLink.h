/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

/// Cross-platform display link wrapper. Do not retain the target
/// Use `CADisplayLink` on iOS/tvOS, `CVDisplayLink` on macOS, `NSTimer` on watchOS
@interface SDDisplayLink : NSObject

@property (readonly, nonatomic, weak, nullable) id target;
@property (readonly, nonatomic, assign, nonnull) SEL selector;
@property (readonly, nonatomic) CFTimeInterval duration;
@property (readonly, nonatomic) BOOL isRunning;

+ (nonnull instancetype)displayLinkWithTarget:(nonnull id)target selector:(nonnull SEL)sel;

- (void)addToRunLoop:(nonnull NSRunLoop *)runloop forMode:(nonnull NSRunLoopMode)mode;
- (void)removeFromRunLoop:(nonnull NSRunLoop *)runloop forMode:(nonnull NSRunLoopMode)mode;

- (void)start;
- (void)stop;

@end
