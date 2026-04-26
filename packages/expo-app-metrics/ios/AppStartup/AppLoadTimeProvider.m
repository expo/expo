// Copyright 2025-present 650 Industries. All rights reserved.

#import <sys/sysctl.h>
#import <ExpoAppMetrics/AppLoadTimeProvider.h>

/**
 Gets the process start time in seconds, relative to Jan 1, 1970.
 Note that it is constant, i.e. does not change when the device's time changes.
 */
static CFTimeInterval getProcessStartTime(void) {
  struct kinfo_proc kinfo;
  int mib[4] = { CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid() };
  size_t size = sizeof(kinfo);
  sysctl(mib, 4, &kinfo, &size, NULL, 0);
  struct timeval startTime = kinfo.kp_proc.p_starttime;
  return startTime.tv_sec + startTime.tv_usec / 1e6;
}

/**
 Static value that stores the application's load time in seconds.
 */
static CFTimeInterval loadTime;

/**
 The OS sets this environment variable if the app start is pre warmed. There are no official
 docs for this. Found at https://eisel.me/startup. Investigations show that this variable is
 deleted after UIApplicationDidFinishLaunchingNotification, so we have to check it here.
 */
static BOOL isActivePrewarm = NO;

/**
 Static initializer that measures how much time it took to load dylibs and execute other initializers since the process started.

 Note that we can't simply measure the load time from the process start to `main()` as iOS 15 introduced pre-warming,
 where initializers and other pre-main steps are run preemptively, potentially hours before the app is started and `main()` is run.
 So instead, we take the difference between the process start time in pre-main initializer and add that later to post-main times.
 The constructor's priority must be between 101 and 65535. The lower the priority number, the sooner the constructor runs.
 As we want to be as close to `main()` as possible, we chose a high number. Any initializers run after this will not have their load time impact included.
 `+load` methods in Objective-C seem to be executing before initializers with `__attribute__((constructor))` which meets our needs.
 */
__used __attribute__((constructor(62137))) static void __mark_finished_loading(void) {
  // In theory it would be better to get the process start time after the app is fully launched,
  // but as opposed to `CFAbsoluteTimeGetCurrent` its value does not change when the device's time changes.
  // Since pre-warming may happen hours before the app launch, it needs to be calculated early so it is not affected by time shifts.
  CFTimeInterval processStartTime = getProcessStartTime();
  CFTimeInterval currentTime = CFAbsoluteTimeGetCurrent() + kCFAbsoluteTimeIntervalSince1970;
  loadTime = currentTime - processStartTime;
  isActivePrewarm = [[NSProcessInfo processInfo].environment[@"ActivePrewarm"] isEqualToString:@"1"];
}

@implementation EXAppLoadTimeProvider

+ (CFTimeInterval)getLoadTime
{
  return loadTime;
}

+ (BOOL)wasPrewarmActive
{
  return isActivePrewarm;
}

@end
