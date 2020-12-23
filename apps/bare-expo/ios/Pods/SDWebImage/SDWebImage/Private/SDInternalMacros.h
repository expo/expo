/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import <os/lock.h>
#import <libkern/OSAtomic.h>
#import "SDmetamacros.h"

#ifndef SD_LOCK_DECLARE
#if TARGET_OS_MACCATALYST
#define SD_LOCK_DECLARE(lock) os_unfair_lock lock;
#else
#define SD_LOCK_DECLARE(lock) os_unfair_lock lock API_AVAILABLE(ios(10.0), tvos(10), watchos(3), macos(10.12)); \
OSSpinLock lock##_deprecated;
#endif
#endif

#ifndef SD_LOCK_INIT
#if TARGET_OS_MACCATALYST
#define SD_LOCK_INIT(lock) lock = OS_UNFAIR_LOCK_INIT;
#else
#define SD_LOCK_INIT(lock) if (@available(iOS 10, tvOS 10, watchOS 3, macOS 10.12, *)) lock = OS_UNFAIR_LOCK_INIT; \
else lock##_deprecated = OS_SPINLOCK_INIT;
#endif
#endif

#ifndef SD_LOCK
#if TARGET_OS_MACCATALYST
#define SD_LOCK(lock) os_unfair_lock_lock(&lock);
#else
#define SD_LOCK(lock) if (@available(iOS 10, tvOS 10, watchOS 3, macOS 10.12, *)) os_unfair_lock_lock(&lock); \
else OSSpinLockLock(&lock##_deprecated);
#endif
#endif

#ifndef SD_UNLOCK
#if TARGET_OS_MACCATALYST
#define SD_UNLOCK(lock) os_unfair_lock_unlock(&lock);
#else
#define SD_UNLOCK(lock) if (@available(iOS 10, tvOS 10, watchOS 3, macOS 10.12, *)) os_unfair_lock_unlock(&lock); \
else OSSpinLockUnlock(&lock##_deprecated);
#endif
#endif

#ifndef SD_OPTIONS_CONTAINS
#define SD_OPTIONS_CONTAINS(options, value) (((options) & (value)) == (value))
#endif

#ifndef SD_CSTRING
#define SD_CSTRING(str) #str
#endif

#ifndef SD_NSSTRING
#define SD_NSSTRING(str) @(SD_CSTRING(str))
#endif

#ifndef SD_SEL_SPI
#define SD_SEL_SPI(name) NSSelectorFromString([NSString stringWithFormat:@"_%@", SD_NSSTRING(name)])
#endif

#ifndef weakify
#define weakify(...) \
sd_keywordify \
metamacro_foreach_cxt(sd_weakify_,, __weak, __VA_ARGS__)
#endif

#ifndef strongify
#define strongify(...) \
sd_keywordify \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
metamacro_foreach(sd_strongify_,, __VA_ARGS__) \
_Pragma("clang diagnostic pop")
#endif

#define sd_weakify_(INDEX, CONTEXT, VAR) \
CONTEXT __typeof__(VAR) metamacro_concat(VAR, _weak_) = (VAR);

#define sd_strongify_(INDEX, VAR) \
__strong __typeof__(VAR) VAR = metamacro_concat(VAR, _weak_);

#if DEBUG
#define sd_keywordify autoreleasepool {}
#else
#define sd_keywordify try {} @catch (...) {}
#endif

#ifndef onExit
#define onExit \
sd_keywordify \
__strong sd_cleanupBlock_t metamacro_concat(sd_exitBlock_, __LINE__) __attribute__((cleanup(sd_executeCleanupBlock), unused)) = ^
#endif

typedef void (^sd_cleanupBlock_t)(void);

#if defined(__cplusplus)
extern "C" {
#endif
    void sd_executeCleanupBlock (__strong sd_cleanupBlock_t *block);
#if defined(__cplusplus)
}
#endif
