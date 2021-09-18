// Copyright 2021-present 650 Industries. All rights reserved.

#import "EXJavaScriptCoreModule.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTModuleData.h>

#import <JavaScriptCore/JavaScriptCore.h>

@interface RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void *)runtime;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation EXJavaScriptCoreModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoJavaScriptCore)

- (JSGlobalContextRef)getJavaScriptContextRef:(RCTBridge *)bridge
{
  if ([bridge respondsToSelector:@selector(jsContextRef)]) {
    return bridge.jsContextRef;
  } else if ([bridge respondsToSelector:@selector(runtime)] && bridge.runtime) {
    // In react-native 0.59 vm is abstracted by JSI and all JSC specific references are removed
    // To access jsc context we are extracting specific offset in jsi::Runtime, JSGlobalContextRef
    // is first field inside Runtime class and in memory it's preceded only by pointer to virtual method table.
    // WARNING: This is temporary solution that may break with new react-native releases.
    return *(((JSGlobalContextRef *)(bridge.runtime)) + 1);
  }
  return nil;
}

- (void)setContextName:(NSString *)name;
{
  if ([self getJavaScriptContextRef:(RCTBridge *)_bridge]) {
    JSContext *jsc = [JSContext contextWithJSGlobalContextRef:[self getJavaScriptContextRef:(RCTBridge *)_bridge]];
    jsc.name = name;
  }
}

RCT_EXPORT_METHOD(setContextName:(NSString *)name
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  [self setContextName: name];
  resolve(nil);
}
@end
