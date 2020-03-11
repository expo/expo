/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDmetamacros.h"

#ifndef SD_LOCK
#define SD_LOCK(lock) dispatch_semaphore_wait(lock, DISPATCH_TIME_FOREVER);
#endif

#ifndef SD_UNLOCK
#define SD_UNLOCK(lock) dispatch_semaphore_signal(lock);
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
