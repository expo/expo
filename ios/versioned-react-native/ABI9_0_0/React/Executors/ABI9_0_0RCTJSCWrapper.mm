/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTJSCWrapper.h"

#import <UIKit/UIKit.h>
#import <JavaScriptCore/JavaScriptCore.h>

#import "ABI9_0_0RCTLog.h"

#include <dlfcn.h>

static void *ABI9_0_0RCTCustomLibraryHandler(void)
{
  static dispatch_once_t token;
  static void *handler;
  dispatch_once(&token, ^{
    const char *path = [[[NSBundle mainBundle] pathForResource:@"JavaScriptCore"
                                                        ofType:nil
                                                   inDirectory:@"Frameworks/JavaScriptCore.framework"] UTF8String];
    if (path) {
      handler = dlopen(path, RTLD_LAZY);
      if (!handler) {
        ABI9_0_0RCTLogWarn(@"Can't load custom JSC library: %s", dlerror());
      }
    }
  });
  return handler;
}

static void ABI9_0_0RCTSetUpSystemLibraryPointers(ABI9_0_0RCTJSCWrapper *wrapper)
{
  wrapper->JSValueToStringCopy = JSValueToStringCopy;
  wrapper->JSStringCreateWithCFString = JSStringCreateWithCFString;
  wrapper->JSStringCopyCFString = JSStringCopyCFString;
  wrapper->JSStringCreateWithUTF8CString = JSStringCreateWithUTF8CString;
  wrapper->JSStringRelease = JSStringRelease;
  wrapper->JSGlobalContextSetName = JSGlobalContextSetName;
  wrapper->JSContextGetGlobalContext = JSContextGetGlobalContext;
  wrapper->JSObjectSetProperty = JSObjectSetProperty;
  wrapper->JSContextGetGlobalObject = JSContextGetGlobalObject;
  wrapper->JSObjectGetProperty = JSObjectGetProperty;
  wrapper->JSValueMakeFromJSONString = JSValueMakeFromJSONString;
  wrapper->JSObjectCallAsFunction = JSObjectCallAsFunction;
  wrapper->JSValueMakeNull = JSValueMakeNull;
  wrapper->JSValueCreateJSONString = JSValueCreateJSONString;
  wrapper->JSValueIsUndefined = JSValueIsUndefined;
  wrapper->JSValueIsNull = JSValueIsNull;
  wrapper->JSEvaluateScript = JSEvaluateScript;
  wrapper->JSContext = [JSContext class];
  wrapper->JSValue = [JSValue class];
  wrapper->configureJSContextForIOS = NULL;
}

static void ABI9_0_0RCTSetUpCustomLibraryPointers(ABI9_0_0RCTJSCWrapper *wrapper)
{
  void *libraryHandle = ABI9_0_0RCTCustomLibraryHandler();
  if (!libraryHandle) {
    ABI9_0_0RCTSetUpSystemLibraryPointers(wrapper);
    return;
  }

  wrapper->JSValueToStringCopy = (JSValueToStringCopyFuncType)dlsym(libraryHandle, "JSValueToStringCopy");
  wrapper->JSStringCreateWithCFString = (JSStringCreateWithCFStringFuncType)dlsym(libraryHandle, "JSStringCreateWithCFString");
  wrapper->JSStringCopyCFString = (JSStringCopyCFStringFuncType)dlsym(libraryHandle, "JSStringCopyCFString");
  wrapper->JSStringCreateWithUTF8CString = (JSStringCreateWithUTF8CStringFuncType)dlsym(libraryHandle, "JSStringCreateWithUTF8CString");
  wrapper->JSStringRelease = (JSStringReleaseFuncType)dlsym(libraryHandle, "JSStringRelease");
  wrapper->JSGlobalContextSetName = (JSGlobalContextSetNameFuncType)dlsym(libraryHandle, "JSGlobalContextSetName");
  wrapper->JSContextGetGlobalContext = (JSContextGetGlobalContextFuncType)dlsym(libraryHandle, "JSContextGetGlobalContext");
  wrapper->JSObjectSetProperty = (JSObjectSetPropertyFuncType)dlsym(libraryHandle, "JSObjectSetProperty");
  wrapper->JSContextGetGlobalObject = (JSContextGetGlobalObjectFuncType)dlsym(libraryHandle, "JSContextGetGlobalObject");
  wrapper->JSObjectGetProperty = (JSObjectGetPropertyFuncType)dlsym(libraryHandle, "JSObjectGetProperty");
  wrapper->JSValueMakeFromJSONString = (JSValueMakeFromJSONStringFuncType)dlsym(libraryHandle, "JSValueMakeFromJSONString");
  wrapper->JSObjectCallAsFunction = (JSObjectCallAsFunctionFuncType)dlsym(libraryHandle, "JSObjectCallAsFunction");
  wrapper->JSValueMakeNull = (JSValueMakeNullFuncType)dlsym(libraryHandle, "JSValueMakeNull");
  wrapper->JSValueCreateJSONString = (JSValueCreateJSONStringFuncType)dlsym(libraryHandle, "JSValueCreateJSONString");
  wrapper->JSValueIsUndefined = (JSValueIsUndefinedFuncType)dlsym(libraryHandle, "JSValueIsUndefined");
  wrapper->JSValueIsNull = (JSValueIsNullFuncType)dlsym(libraryHandle, "JSValueIsNull");
  wrapper->JSEvaluateScript = (JSEvaluateScriptFuncType)dlsym(libraryHandle, "JSEvaluateScript");
  wrapper->JSContext = (__bridge Class)dlsym(libraryHandle, "OBJC_CLASS_$_JSContext");
  wrapper->JSValue = (__bridge Class)dlsym(libraryHandle, "OBJC_CLASS_$_JSValue");
  wrapper->configureJSContextForIOS = (configureJSContextForIOSFuncType)dlsym(libraryHandle, "configureJSContextForIOS");
}

ABI9_0_0RCTJSCWrapper *ABI9_0_0RCTJSCWrapperCreate(BOOL useCustomJSC)
{
  ABI9_0_0RCTJSCWrapper *wrapper = (ABI9_0_0RCTJSCWrapper *)malloc(sizeof(ABI9_0_0RCTJSCWrapper));
  if (useCustomJSC && [UIDevice currentDevice].systemVersion.floatValue >= 8) {
    ABI9_0_0RCTSetUpCustomLibraryPointers(wrapper);
  } else {
    ABI9_0_0RCTSetUpSystemLibraryPointers(wrapper);
  }
  return wrapper;
}

void ABI9_0_0RCTJSCWrapperRelease(ABI9_0_0RCTJSCWrapper *wrapper)
{
  if (wrapper) {
    free(wrapper);
  }
}
