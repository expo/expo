#ifndef __EXJSUTILS_H__
#define __EXJSUTILS_H__

#include <stdint.h>

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/JSValueRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>


// Whether JavaScriptCore has JSTypedArray.h
#ifdef __APPLE__
#define EXJS_USE_JSC_TYPEDARRAY_HEADER
#endif
#ifdef EXJS_USE_JSC_TYPEDARRAY_HEADER
#include <JavaScriptCore/JSTypedArray.h>
#endif


#ifdef __cplusplus
extern "C" {
#endif


// Most of these are adapted from phoboslab/Ejecta on GitHub
// (https://github.com/phoboslab/Ejecta).


static inline double EXJSValueToNumberFast(JSContextRef ctx, JSValueRef v)
{
#if __LP64__ // arm64 version
  union {
    int64_t asInt64;
    double asDouble;
    struct { int32_t asInt; int32_t tag; } asBits;
  } taggedValue = { .asInt64 = (int64_t)v };

#define DoubleEncodeOffset 0x1000000000000ll
#define TagTypeNumber 0xffff0000
#define ValueTrue 0x7

  if( (taggedValue.asBits.tag & TagTypeNumber) == TagTypeNumber ) {
    return taggedValue.asBits.asInt;
  }
  else if( taggedValue.asBits.tag & TagTypeNumber ) {
    taggedValue.asInt64 -= DoubleEncodeOffset;
    return taggedValue.asDouble;
  }
  else if( taggedValue.asBits.asInt == ValueTrue ) {
    return 1.0;
  }
  else {
    return 0; // false, undefined, null, object
  }
#else // armv7 version
  return JSValueToNumber(ctx, v, NULL);
#endif
}

static inline JSValueRef EXJSObjectGetPropertyNamed(JSContextRef ctx, JSObjectRef object, const char *name) {
  JSStringRef jsPropertyName = JSStringCreateWithUTF8CString(name);
  JSValueRef value = JSObjectGetProperty(ctx, object, jsPropertyName, NULL);
  JSStringRelease(jsPropertyName);
  return value;
}

static inline JSValueRef EXJSValueMakeStringFromUTF8CString(JSContextRef ctx, const char *str) {
  JSStringRef jsStr = JSStringCreateWithUTF8CString(str);
  JSValueRef value = JSValueMakeString(ctx, jsStr);
  JSStringRelease(jsStr);
  return value;
}

void EXJSConsoleLog(JSContextRef ctx, const char *msg);

char *EXJSValueToUTF8CStringMalloc(JSContextRef ctx, JSValueRef v, JSValueRef *exception);


void EXJSObjectSetValueWithUTF8CStringName(JSContextRef ctx,
                                           JSObjectRef obj,
                                           const char *name,
                                           JSValueRef val);

void EXJSObjectSetFunctionWithUTF8CStringName(JSContextRef ctx,
                                              JSObjectRef obj,
                                              const char *name,
                                              JSObjectCallAsFunctionCallback func);


#define _EXJS_COMMA() ,
#define _EXJS_EMPTY()
#define _EXJS_LITERAL(X) X _EXJS_EMPTY


#define EXJS_MAP_EXT(OFFSET, JOINER, F, ...) _EXJS_EVAL(_EXJS_MAP1(OFFSET, JOINER, F, __VA_ARGS__, (), 0))
#define EXJS_MAP(F, ...) _EXJS_EVAL(_EXJS_MAP1(0, _EXJS_EMPTY, F, __VA_ARGS__, (), 0))

#define _EXJS_EVAL0(...) __VA_ARGS__
#define _EXJS_EVAL1(...) _EXJS_EVAL0( _EXJS_EVAL0(__VA_ARGS__) )
#define _EXJS_EVAL2(...) _EXJS_EVAL1( _EXJS_EVAL1(__VA_ARGS__) )
#define _EXJS_EVAL(...) _EXJS_EVAL2( _EXJS_EVAL2(__VA_ARGS__) )

#define _EXJS_MAP_END(...)
#define _EXJS_MAP_OUT
#define _EXJS_MAP_GET_END() 0, _EXJS_MAP_END
#define _EXJS_MAP_NEXT0(ITEM, NEXT, ...) NEXT _EXJS_MAP_OUT
#define _EXJS_MAP_NEXT1(JOINER, ITEM, NEXT) _EXJS_MAP_NEXT0 (ITEM, JOINER() NEXT, 0)
#define _EXJS_MAP_NEXT(JOINER, ITEM, NEXT) _EXJS_MAP_NEXT1 (JOINER, _EXJS_MAP_GET_END ITEM, NEXT)

#define _EXJS_MAP0(IDX, JOINER, F, NAME, PEEK, ...) F(IDX, NAME) _EXJS_MAP_NEXT(JOINER, PEEK, _EXJS_MAP1) (IDX+1, JOINER, F, PEEK, __VA_ARGS__)
#define _EXJS_MAP1(IDX, JOINER, F, NAME, PEEK, ...) F(IDX, NAME) _EXJS_MAP_NEXT(JOINER, PEEK, _EXJS_MAP0) (IDX+1, JOINER, F, PEEK, __VA_ARGS__)


#define EXJS_ARGC(...) _EXJS_ARGC_SEQ(__VA_ARGS__,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1)
#define _EXJS_ARGC_SEQ(x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,n,...) n


#define EXJS_UNPACK_ARGV(...) EXJS_UNPACK_ARGV_OFFSET(0, __VA_ARGS__)
#define EXJS_UNPACK_ARGV_OFFSET(OFFSET, ...) \
EXJS_MAP_EXT(OFFSET, _EXJS_LITERAL(;), _EXJS_UNPACK_NUMBER, __VA_ARGS__)

#define _EXJS_UNPACK_NUMBER(INDEX, NAME) NAME = EXJSValueToNumberFast(jsCtx, jsArgv[INDEX])


// If JavaScriptCore doesn't have JSTypedArray.h we declare the minimum stuff we need from it
#ifndef EXJS_USE_JSC_TYPEDARRAY_HEADER

JS_EXPORT JSTypedArrayType JSValueGetTypedArrayType(JSContextRef ctx, JSValueRef value, JSValueRef* exception);
JS_EXPORT size_t JSObjectGetArrayBufferByteLength(JSContextRef ctx, JSObjectRef object, JSValueRef* exception);
JS_EXPORT void* JSObjectGetArrayBufferBytesPtr(JSContextRef ctx, JSObjectRef object, JSValueRef* exception);
JS_EXPORT size_t JSObjectGetTypedArrayByteLength(JSContextRef ctx, JSObjectRef object,
                                                 JSValueRef* exception);
JS_EXPORT void* JSObjectGetTypedArrayBytesPtr(JSContextRef ctx, JSObjectRef object,
                                              JSValueRef* exception);
JS_EXPORT JSObjectRef JSObjectMakeTypedArrayWithBytesNoCopy(JSContextRef ctx, JSTypedArrayType arrayType,
                                                            void* bytes, size_t byteLength,
                                                            JSTypedArrayBytesDeallocator bytesDeallocator,
                                                            void* deallocatorContext,
                                                            JSValueRef* exception);
JS_EXPORT JSObjectRef JSObjectMakeTypedArray(JSContextRef ctx, JSTypedArrayType arrayType,
                                             size_t length, JSValueRef* exception);

#endif


#ifdef __cplusplus
}
#endif


#endif
