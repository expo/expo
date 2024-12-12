// Copyright 2024-present 650 Industries. All rights reserved.

#import <BackgroundTaskTester.h>
#import <BackgroundTasks/BGTaskScheduler.h>
#import <ExpoModulesCore/EXDefines.h>
#import <ExpoBackgroundTask-Swift.h>

@implementation BackgroundTaskTester

- (void) triggerBackgroundTaskTest {
#if DEBUG
  SEL selector = NSSelectorFromString([@"_simulate" stringByAppendingString:@"LaunchForTaskWithIdentifier:"]);
  Method method = class_getInstanceMethod([BGTaskScheduler class], selector);
  if (method) {
    NSLog(@"BackgroundTaskScheduler: calling _simulate+Launch+For+Task+With+Identifier method on BGTaskScheduler");
    void (*implementation)(id, SEL, NSString *) = (void (*)(id, SEL, NSString *))method_getImplementation(method);
    implementation([BGTaskScheduler sharedScheduler], selector, BackgroundTaskConstants.BackgroundWorkerIdentifier);
  } else {
    NSLog(@"BackgroundTaskScheduler: _simulate+Launch+For+Task+With+Identifier method not found on BGTaskScheduler.");
  }
#else
  EXFatal (EXErrorWithMessage(@"Triggering background tasks are not allowed in release builds."));
#endif
}

@end
