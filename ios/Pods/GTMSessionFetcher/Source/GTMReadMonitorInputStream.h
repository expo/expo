/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

#ifndef GTM_NONNULL
  #if defined(__has_attribute)
    #if __has_attribute(nonnull)
      #define GTM_NONNULL(x) __attribute__((nonnull x))
    #else
      #define GTM_NONNULL(x)
    #endif
  #else
    #define GTM_NONNULL(x)
  #endif
#endif


@interface GTMReadMonitorInputStream : NSInputStream <NSStreamDelegate>

+ (instancetype)inputStreamWithStream:(NSInputStream *)input GTM_NONNULL((1));

- (instancetype)initWithStream:(NSInputStream *)input GTM_NONNULL((1));

// The read monitor selector is called when bytes have been read. It should have this signature:
//
// - (void)inputStream:(GTMReadMonitorInputStream *)stream
//      readIntoBuffer:(uint8_t *)buffer
//              length:(int64_t)length;

@property(atomic, weak) id readDelegate;
@property(atomic, assign) SEL readSelector;

// Modes for invoking callbacks, when necessary.
@property(atomic, strong) NSArray *runLoopModes;

@end
