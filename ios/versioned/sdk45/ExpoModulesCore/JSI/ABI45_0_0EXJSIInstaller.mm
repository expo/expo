// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJSIInstaller.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0ExpoModulesHostObject.h>
#import <ABI45_0_0ExpoModulesCore/Swift.h>

@implementation ABI45_0_0EXJavaScriptRuntimeManager

+ (void)installExpoModulesToRuntime:(nonnull ABI45_0_0EXJavaScriptRuntime *)runtime withSwiftInterop:(nonnull SwiftInteropBridge *)swiftInterop
{
  std::shared_ptr<ABI45_0_0expo::ExpoModulesHostObject> hostObjectPtr = std::make_shared<ABI45_0_0expo::ExpoModulesHostObject>(swiftInterop);
  ABI45_0_0EXJavaScriptObject *global = [runtime global];

  [global setProperty:@"ExpoModules" value:[runtime createHostObject:hostObjectPtr]];
}

@end
