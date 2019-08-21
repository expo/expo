/*
 * Copyright 2018 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "GDTLibrary/Public/GDTClock.h"

#import <sys/sysctl.h>

// Using a monotonic clock is necessary because CFAbsoluteTimeGetCurrent(), NSDate, and related all
// are subject to drift. That it to say, multiple consecutive calls do not always result in a
// time that is in the future. Clocks may be adjusted by the user, NTP, or any number of external
// factors. This class attempts to determine the wall-clock time at the time of the event by
// capturing the kernel start and time since boot to determine a wallclock time in UTC.
//
// Timezone offsets at the time of a snapshot are also captured in order to provide local-time
// details. Other classes in this library depend on comparing times at some time in the future to
// a time captured in the past, and this class needs to provide a mechanism to do that.
//
// TL;DR: This class attempts to accomplish two things: 1. Provide accurate event times. 2. Provide
// a monotonic clock mechanism to accurately check if some clock snapshot was before or after
// by using a shared reference point (kernel boot time).
//
// Note: Much of the mach time stuff doesn't work properly in the simulator. So this class can be
// difficult to unit test.

/** Returns the kernel boottime property from sysctl.
 *
 * Inspired by https://stackoverflow.com/a/40497811
 *
 * @return The KERN_BOOTTIME property from sysctl, in nanoseconds.
 */
static int64_t KernelBootTimeInNanoseconds() {
  // Caching the result is not possible because clock drift would not be accounted for.
  struct timeval boottime;
  int mib[2] = {CTL_KERN, KERN_BOOTTIME};
  size_t size = sizeof(boottime);
  int rc = sysctl(mib, 2, &boottime, &size, NULL, 0);
  if (rc != 0) {
    return 0;
  }
  return (int64_t)boottime.tv_sec * NSEC_PER_MSEC + (int64_t)boottime.tv_usec;
}

/** Returns value of gettimeofday, in nanoseconds.
 *
 * Inspired by https://stackoverflow.com/a/40497811
 *
 * @return The value of gettimeofday, in nanoseconds.
 */
static int64_t UptimeInNanoseconds() {
  int64_t before_now;
  int64_t after_now;
  struct timeval now;

  before_now = KernelBootTimeInNanoseconds();
  // Addresses a race condition in which the system time has updated, but the boottime has not.
  do {
    gettimeofday(&now, NULL);
    after_now = KernelBootTimeInNanoseconds();
  } while (after_now != before_now);
  return (int64_t)now.tv_sec * NSEC_PER_MSEC + (int64_t)now.tv_usec - before_now;
}

// TODO: Consider adding a 'trustedTime' property that can be populated by the response from a BE.
@implementation GDTClock

- (instancetype)init {
  self = [super init];
  if (self) {
    _kernelBootTime = KernelBootTimeInNanoseconds();
    _uptime = UptimeInNanoseconds();
    _timeMillis =
        (int64_t)((CFAbsoluteTimeGetCurrent() + kCFAbsoluteTimeIntervalSince1970) * NSEC_PER_USEC);
    CFTimeZoneRef timeZoneRef = CFTimeZoneCopySystem();
    _timezoneOffsetSeconds = CFTimeZoneGetSecondsFromGMT(timeZoneRef, 0);
    CFRelease(timeZoneRef);
  }
  return self;
}

+ (GDTClock *)snapshot {
  return [[GDTClock alloc] init];
}

+ (instancetype)clockSnapshotInTheFuture:(uint64_t)millisInTheFuture {
  GDTClock *snapshot = [self snapshot];
  snapshot->_timeMillis += millisInTheFuture;
  return snapshot;
}

- (BOOL)isAfter:(GDTClock *)otherClock {
  // These clocks are trivially comparable when they share a kernel boot time.
  if (_kernelBootTime == otherClock->_kernelBootTime) {
    int64_t timeDiff = (_timeMillis + _timezoneOffsetSeconds) -
                       (otherClock->_timeMillis + otherClock->_timezoneOffsetSeconds);
    return timeDiff > 0;
  } else {
    int64_t kernelBootTimeDiff = otherClock->_kernelBootTime - _kernelBootTime;
    // This isn't a great solution, but essentially, if the other clock's boot time is 'later', NO
    // is returned. This can be altered by changing the system time and rebooting.
    return kernelBootTimeDiff < 0 ? YES : NO;
  }
}

- (NSUInteger)hash {
  return [@(_kernelBootTime) hash] ^ [@(_uptime) hash] ^ [@(_timeMillis) hash] ^
         [@(_timezoneOffsetSeconds) hash];
}

- (BOOL)isEqual:(id)object {
  return [self hash] == [object hash];
}

#pragma mark - NSSecureCoding

/** NSKeyedCoder key for timeMillis property. */
static NSString *const kGDTClockTimeMillisKey = @"GDTClockTimeMillis";

/** NSKeyedCoder key for timezoneOffsetMillis property. */
static NSString *const kGDTClockTimezoneOffsetSeconds = @"GDTClockTimezoneOffsetSeconds";

/** NSKeyedCoder key for _kernelBootTime ivar. */
static NSString *const kGDTClockKernelBootTime = @"GDTClockKernelBootTime";

/** NSKeyedCoder key for _uptime ivar. */
static NSString *const kGDTClockUptime = @"GDTClockUptime";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  self = [super init];
  if (self) {
    // TODO: If the kernelBootTime is more recent, we need to change the kernel boot time and
    // uptimeMillis ivars
    _timeMillis = [aDecoder decodeInt64ForKey:kGDTClockTimeMillisKey];
    _timezoneOffsetSeconds = [aDecoder decodeInt64ForKey:kGDTClockTimezoneOffsetSeconds];
    _kernelBootTime = [aDecoder decodeInt64ForKey:kGDTClockKernelBootTime];
    _uptime = [aDecoder decodeInt64ForKey:kGDTClockUptime];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeInt64:_timeMillis forKey:kGDTClockTimeMillisKey];
  [aCoder encodeInt64:_timezoneOffsetSeconds forKey:kGDTClockTimezoneOffsetSeconds];
  [aCoder encodeInt64:_kernelBootTime forKey:kGDTClockKernelBootTime];
  [aCoder encodeInt64:_uptime forKey:kGDTClockUptime];
}

@end
