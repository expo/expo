#if !TARGET_OS_OSX

#import <QuartzCore/CADisplayLink.h>

typedef CADisplayLink READisplayLink;

#else // TARGET_OS_OSX [

#ifdef __cplusplus
extern "C" {
#endif

#import <React/RCTPlatformDisplayLink.h>

#ifdef __cplusplus
}
#endif

typedef RCTPlatformDisplayLink READisplayLink;

#endif // ] TARGET_OS_OSX
