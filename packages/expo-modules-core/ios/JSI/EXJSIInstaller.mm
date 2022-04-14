// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/Swift.h>

@implementation EXJavaScriptRuntimeManager

+ (void)installExpoModulesToRuntime:(nonnull EXJavaScriptRuntime *)runtime withSwiftInterop:(nonnull SwiftInteropBridge *)swiftInterop
{
  std::shared_ptr<expo::ExpoModulesHostObject> hostObjectPtr = std::make_shared<expo::ExpoModulesHostObject>(swiftInterop);
  EXJavaScriptObject *global = [runtime global];

  [global setProperty:@"ExpoModules" value:[runtime createHostObject:hostObjectPtr]];
}

@end
