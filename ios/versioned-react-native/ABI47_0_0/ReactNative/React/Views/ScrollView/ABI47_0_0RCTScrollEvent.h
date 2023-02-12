/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

@interface ABI47_0_0RCTScrollEvent : NSObject <ABI47_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
          scrollViewContentOffset:(CGPoint)scrollViewContentOffset
           scrollViewContentInset:(UIEdgeInsets)scrollViewContentInset
            scrollViewContentSize:(CGSize)scrollViewContentSize
                  scrollViewFrame:(CGRect)scrollViewFrame
              scrollViewZoomScale:(CGFloat)scrollViewZoomScale
                         userData:(NSDictionary *)userData
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end
