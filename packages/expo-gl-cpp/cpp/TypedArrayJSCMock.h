#pragma once

#include <JavaScriptCore/JSValueRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSContextRef.h>

#if false

//typedef enum {
//    kJSTypedArrayTypeNone = 0,
//    kJSTypedArrayTypeInt8Array = 1,
//    kJSTypedArrayTypeInt16Array = 2,
//    kJSTypedArrayTypeInt32Array = 3,
//    kJSTypedArrayTypeUint8Array = 4,
//    kJSTypedArrayTypeUint8ClampedArray = 5,
//    kJSTypedArrayTypeUint16Array = 6,
//    kJSTypedArrayTypeUint32Array = 7,
//    kJSTypedArrayTypeFloat32Array = 8,
//    kJSTypedArrayTypeFloat64Array = 9,
//    kJSTypedArrayTypeArrayBuffer = 10
//} JSTypedArrayType;

JS_EXPORT JSTypedArrayType JSValueGetTypedArrayType(JSContextRef ctx, JSValueRef value, JSValueRef* exception) {
  return kJSTypedArrayTypeNone;
}

JS_EXPORT size_t JSObjectGetArrayBufferByteLength(JSContextRef ctx, JSObjectRef object, JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return 0;
}

JS_EXPORT void* JSObjectGetArrayBufferBytesPtr(JSContextRef ctx, JSObjectRef object, JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return NULL;
}

JS_EXPORT size_t JSObjectGetTypedArrayByteLength(JSContextRef ctx, JSObjectRef object,
                                                 JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return 0;
}

JS_EXPORT void* JSObjectGetTypedArrayBytesPtr(JSContextRef ctx, JSObjectRef object,
                                              JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return NULL;
}

JS_EXPORT JSObjectRef JSObjectMakeTypedArrayWithBytesNoCopy(JSContextRef ctx, JSTypedArrayType arrayType,
                                                            void* bytes, size_t byteLength,
                                                            JSTypedArrayBytesDeallocator bytesDeallocator,
                                                            void* deallocatorContext,
                                                            JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return (JSObjectRef) JSValueMakeNull(ctx);
}

JS_EXPORT JSObjectRef JSObjectMakeTypedArray(JSContextRef ctx, JSTypedArrayType arrayType,
                                             size_t length, JSValueRef* exception) {
  // JSCConsoleLog(ctx, "EXJS: Tried to use non-existent TypedArray API");
  return (JSObjectRef) JSValueMakeNull(ctx);
}

#endif
