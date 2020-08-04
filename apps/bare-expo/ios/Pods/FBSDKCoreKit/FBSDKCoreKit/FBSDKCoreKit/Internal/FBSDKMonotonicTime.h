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

#include <stdint.h>

typedef double FBSDKMonotonicTimeSeconds;
typedef uint64_t FBSDKMonotonicTimeMilliseconds;
typedef uint64_t FBSDKMonotonicTimeNanoseconds;
typedef uint64_t FBSDKMachAbsoluteTimeUnits;

/**
 * return current monotonic time in Milliseconds
 * Millisecond precision, uint64_t value.
 * Avoids float/double math operations, thus more efficient than FBSDKMonotonicTimeGetCurrentSeconds.
 * Should be preferred over FBSDKMonotonicTimeGetCurrentSeconds in case millisecond
 * precision is required.
 * IMPORTANT: this timer doesn't run while the device is sleeping.
 */
FBSDKMonotonicTimeMilliseconds FBSDKMonotonicTimeGetCurrentMilliseconds(void);

/**
 * return current monotonic time in Seconds
 * Nanosecond precision, double value.
 * Should be preferred over FBSDKMonotonicTimeGetCurrentMilliseconds in case
 * nanosecond precision is required.
 * IMPORTANT: this timer doesn't run while the device is sleeping.
 */
FBSDKMonotonicTimeSeconds FBSDKMonotonicTimeGetCurrentSeconds(void);

/**
 * return current monotonic time in NanoSeconds
 * Nanosecond precision, uint64_t value.
 * Useful when nanosecond precision is required but you want to avoid float/double math operations.
 * IMPORTANT: this timer doesn't run while the device is sleeping.
 */
FBSDKMonotonicTimeNanoseconds FBSDKMonotonicTimeGetCurrentNanoseconds(void);

/**
 * return number of MachTimeUnits for given number of seconds
 * this is useful when you want to use the really fast mach_absolute_time() function
 * to calculate deltas between two points and then check it against a (precomputed) threshold.
 * Nanosecond precision, uint64_t value.
 */
FBSDKMachAbsoluteTimeUnits FBSDKMonotonicTimeConvertSecondsToMachUnits(FBSDKMonotonicTimeSeconds seconds);

/**
 * return the number of seconds for a given amount of MachTimeUnits
 * this is useful when you want to use the really fast mach_absolute_time() function, take
 * deltas between time points, and when you're out of the timing critical section, use
 * this function to compute how many seconds the delta works out to be.
 */
FBSDKMonotonicTimeSeconds FBSDKMonotonicTimeConvertMachUnitsToSeconds(FBSDKMachAbsoluteTimeUnits machUnits);
