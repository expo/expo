/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTJSCWrapper.h"

#import <UIKit/UIKit.h>
#import <JavaScriptCore/JavaScriptCore.h>

#import "ABI12_0_0RCTLog.h"

#include <dlfcn.h>


void __attribute__((visibility("hidden"),weak)) ABI12_0_0RCTCustomJSCInit(__unused void *handle) {
  return;
}

static void *ABI12_0_0RCTCustomLibraryHandler(void)
{
  static dispatch_once_t token;
  static void *handler;
  dispatch_once(&token, ^{
    handler = dlopen("@executable_path/Frameworks/JSC.framework/JSC", RTLD_LAZY | RTLD_LOCAL);
    if (!handler) {
      const char *err = dlerror();

      // Ignore the dlopen failure if custom JSC wasn't included in our app
      // bundle. Unfortunately dlopen only provides string based errors.
      if (err != nullptr && strstr(err, "image not found") == nullptr) {
        ABI12_0_0RCTLogWarn(@"Can't load custom JSC library: %s", err);
      }
    }
  });

  return handler;
}

static void ABI12_0_0RCTSetUpSystemLibraryPointers(ABI12_0_0RCTJSCWrapper *wrapper)
{
  wrapper->JSStringCreateWithCFString = JSStringCreateWithCFString;
  wrapper->JSStringCreateWithUTF8CString = JSStringCreateWithUTF8CString;
  wrapper->JSStringRelease = JSStringRelease;
  wrapper->JSGlobalContextSetName = JSGlobalContextSetName;
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
}

static void ABI12_0_0RCTSetUpCustomLibraryPointers(ABI12_0_0RCTJSCWrapper *wrapper)
{
  void *libraryHandle = ABI12_0_0RCTCustomLibraryHandler();
  if (!libraryHandle) {
    ABI12_0_0RCTSetUpSystemLibraryPointers(wrapper);
    return;
  }

  wrapper->JSStringCreateWithCFString = (JSStringCreateWithCFStringFuncType)dlsym(libraryHandle, "JSStringCreateWithCFString");
  wrapper->JSStringCreateWithUTF8CString = (JSStringCreateWithUTF8CStringFuncType)dlsym(libraryHandle, "JSStringCreateWithUTF8CString");
  wrapper->JSStringRelease = (JSStringReleaseFuncType)dlsym(libraryHandle, "JSStringRelease");
  wrapper->JSGlobalContextSetName = (JSGlobalContextSetNameFuncType)dlsym(libraryHandle, "JSGlobalContextSetName");
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

  static dispatch_once_t once;
  dispatch_once(&once, ^{
    ABI12_0_0RCTCustomJSCInit(libraryHandle);
  });
}

ABI12_0_0RCTJSCWrapper *ABI12_0_0RCTJSCWrapperCreate(BOOL useCustomJSC)
{
  ABI12_0_0RCTJSCWrapper *wrapper = (ABI12_0_0RCTJSCWrapper *)malloc(sizeof(ABI12_0_0RCTJSCWrapper));
  if (useCustomJSC) {
    ABI12_0_0RCTSetUpCustomLibraryPointers(wrapper);
  } else {
    ABI12_0_0RCTSetUpSystemLibraryPointers(wrapper);
  }
  return wrapper;
}

void ABI12_0_0RCTJSCWrapperRelease(ABI12_0_0RCTJSCWrapper *wrapper)
{
  if (wrapper) {
    free(wrapper);
  }
}
