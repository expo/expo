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

// The GTMGatherInput stream is an input stream implementation that is to be
// instantiated with an NSArray of NSData objects.  It works in the traditional
// scatter/gather vector I/O model.  Rather than allocating a big NSData object
// to hold all of the data and performing a copy into that object, the
// GTMGatherInputStream will maintain a reference to the NSArray and read from
// each NSData in turn as the read method is called.  You should not alter the
// underlying set of NSData objects until all read operations on this input
// stream have completed.

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

// Avoid multiple declaration of this class.
//
// Note: This should match the declaration of GTMGatherInputStream in GTMMIMEDocument.m

#ifndef GTM_GATHERINPUTSTREAM_DECLARED
#define GTM_GATHERINPUTSTREAM_DECLARED

@interface GTMGatherInputStream : NSInputStream <NSStreamDelegate>

+ (NSInputStream *)streamWithArray:(NSArray *)dataArray GTM_NONNULL((1));

@end

#endif  // GTM_GATHERINPUTSTREAM_DECLARED
