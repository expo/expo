/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDImageCoder.h"

/**
 Global object holding the array of coders, so that we avoid passing them from object to object.
 Uses a priority queue behind scenes, which means the latest added coders have the highest priority.
 This is done so when encoding/decoding something, we go through the list and ask each coder if they can handle the current data.
 That way, users can add their custom coders while preserving our existing prebuilt ones
 
 Note: the `coders` getter will return the coders in their reversed order
 Example:
 - by default we internally set coders = `IOCoder`, `GIFCoder`, `APNGCoder`
 - calling `coders` will return `@[IOCoder, GIFCoder, APNGCoder]`
 - call `[addCoder:[MyCrazyCoder new]]`
 - calling `coders` now returns `@[IOCoder, GIFCoder, APNGCoder, MyCrazyCoder]`
 
 Coders
 ------
 A coder must conform to the `SDImageCoder` protocol or even to `SDProgressiveImageCoder` if it supports progressive decoding
 Conformance is important because that way, they will implement `canDecodeFromData` or `canEncodeToFormat`
 Those methods are called on each coder in the array (using the priority order) until one of them returns YES.
 That means that coder can decode that data / encode to that format
 */
@interface SDImageCodersManager : NSObject <SDImageCoder>

/**
 Returns the global shared coders manager instance.
 */
@property (nonatomic, class, readonly, nonnull) SDImageCodersManager *sharedManager;

/**
 All coders in coders manager. The coders array is a priority queue, which means the later added coder will have the highest priority
 */
@property (nonatomic, copy, nullable) NSArray<id<SDImageCoder>> *coders;

/**
 Add a new coder to the end of coders array. Which has the highest priority.

 @param coder coder
 */
- (void)addCoder:(nonnull id<SDImageCoder>)coder;

/**
 Remove a coder in the coders array.

 @param coder coder
 */
- (void)removeCoder:(nonnull id<SDImageCoder>)coder;

@end
