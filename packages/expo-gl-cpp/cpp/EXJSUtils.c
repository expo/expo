#include "EXJSUtils.h"

#include <stdlib.h>

#include <JavaScriptCore/JSValueRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSContextRef.h>


void EXJSConsoleLog(JSContextRef ctx, const char *msg) {
  JSObjectRef global = JSContextGetGlobalObject(ctx);
  JSObjectRef console = (JSObjectRef) EXJSObjectGetPropertyNamed(ctx, global, "console");
  JSObjectRef log = (JSObjectRef) EXJSObjectGetPropertyNamed(ctx, console, "log");
  JSValueRef msgStr = EXJSValueMakeStringFromUTF8CString(ctx, msg);
  JSObjectCallAsFunction(ctx, log, console, 1, &msgStr, NULL);
}


char *EXJSValueToUTF8CStringMalloc(JSContextRef ctx, JSValueRef v, JSValueRef *exception) {
  JSStringRef jsStr = JSValueToStringCopy(ctx, v, exception);
  size_t nBytes = JSStringGetMaximumUTF8CStringSize(jsStr);
  char *cStr = (char *) malloc(nBytes * sizeof(char));
  JSStringGetUTF8CString(jsStr, cStr, nBytes);
  JSStringRelease(jsStr);
  return cStr;
}


void EXJSObjectSetValueWithUTF8CStringName(JSContextRef ctx,
                                           JSObjectRef obj,
                                           const char *name,
                                           JSValueRef val) {
  JSStringRef jsName = JSStringCreateWithUTF8CString(name);
  JSObjectSetProperty(ctx, obj, jsName, val, 0, NULL);
  JSStringRelease(jsName);
}

void EXJSObjectSetFunctionWithUTF8CStringName(JSContextRef ctx,
                                              JSObjectRef obj,
                                              const char *name,
                                              JSObjectCallAsFunctionCallback func) {
  JSStringRef jsName = JSStringCreateWithUTF8CString(name);
  JSObjectRef jsFunction = JSObjectMakeFunctionWithCallback(ctx, jsName, func);
  JSObjectSetProperty(ctx, obj, jsName, jsFunction, 0, NULL);
  JSStringRelease(jsName);
}


#ifndef EXJS_USE_JSC_TYPEDARRAY_HEADER

JS_EXPORT JSTypedArrayType JSValueGetTypedArrayType(JSContextRef ctx, JSValueRef value, JSValueRef* exception) {
  return kJSTypedArrayTypeNone;
}

JS_EXPORT size_t JSObjectGetArrayBufferByteLength(JSContextRef ctx, JSObjectRef object, JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return 0;
}

JS_EXPORT void* JSObjectGetArrayBufferBytesPtr(JSContextRef ctx, JSObjectRef object, JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return NULL;
}

JS_EXPORT size_t JSObjectGetTypedArrayByteLength(JSContextRef ctx, JSObjectRef object,
                                                 JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return 0;
}

JS_EXPORT void* JSObjectGetTypedArrayBytesPtr(JSContextRef ctx, JSObjectRef object,
                                              JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return NULL;
}

JS_EXPORT JSObjectRef JSObjectMakeTypedArrayWithBytesNoCopy(JSContextRef ctx, JSTypedArrayType arrayType,
                                                            void* bytes, size_t byteLength,
                                                            JSTypedArrayBytesDeallocator bytesDeallocator,
                                                            void* deallocatorContext,
                                                            JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return (JSObjectRef) JSValueMakeNull(ctx);
}

JS_EXPORT JSObjectRef JSObjectMakeTypedArray(JSContextRef ctx, JSTypedArrayType arrayType,
                                             size_t length, JSValueRef* exception) {
  EXJSConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return (JSObjectRef) JSValueMakeNull(ctx);
}

#endif
