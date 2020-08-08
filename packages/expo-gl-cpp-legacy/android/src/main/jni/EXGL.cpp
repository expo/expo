#include <stdint.h>

#include <jni.h>
#include <thread>
#include <android/log.h>

#include <JavaScriptCore/JSContextRef.h>


#include "UEXGL.h"

#ifdef __cplusplus
extern "C" {
#endif

JNIEXPORT jint JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextCreate
(JNIEnv *env, jclass clazz, jlong jsCtxPtr) {
  JSGlobalContextRef jsCtx = (JSGlobalContextRef) (intptr_t) jsCtxPtr;
  if (jsCtx) {
    return UEXGLContextCreate__Legacy(jsCtx);
  }
  return 0;
}

JNIEXPORT jint JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextCreateV2
(JNIEnv *env, jclass clazz, jlong jsCtxPtr) {
  // In react-native 0.59 jsCtxPtr is pointing to runtime object (in case of JSC it's JSCRuntime class)
  // implementing JSI interface. Real JSC context ref is extracted by offset from that object.
  // WARNING: This is temporary solution that may break with new react-native releases.
  JSGlobalContextRef jsCtx = *(reinterpret_cast<JSGlobalContextRef*>(jsCtxPtr)+1);
  if (jsCtx) {
    return UEXGLContextCreate__Legacy(jsCtx);
  }
  return 0;
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextDestroy
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextDestroy__Legacy(exglCtxId);
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextFlush
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextFlush__Legacy(exglCtxId);
}

JNIEXPORT jint JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextCreateObject
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  return UEXGLContextCreateObject__Legacy(exglCtxId);
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextDestroyObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId) {
  UEXGLContextDestroyObject__Legacy(exglCtxId, exglObjId);
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextMapObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId, jint glObj) {
  UEXGLContextMapObject__Legacy(exglCtxId, exglObjId, glObj);
}

JNIEXPORT jint JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextGetObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId) {
  return UEXGLContextGetObject__Legacy(exglCtxId, exglObjId);
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextSetFlushMethod
(JNIEnv *env, jclass clazz, jint exglCtxId, jobject glContext) {
  jclass GLContextClass = env->GetObjectClass(glContext);
  jobject glContextRef = env->NewGlobalRef(glContext);
  jmethodID flushMethodRef = env->GetMethodID(GLContextClass, "flush", "()V");

  std::function<void(void)> flushMethod = [env, glContextRef, flushMethodRef, exglCtxId] {
    env->CallVoidMethod(glContextRef, flushMethodRef);
  };
  UEXGLContextSetFlushMethod__Legacy(exglCtxId, flushMethod);
}

JNIEXPORT bool JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextNeedsRedraw
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  return UEXGLContextNeedsRedraw__Legacy(exglCtxId);
}

JNIEXPORT void JNICALL
Java_expo_modules_gl_cpp_legacy_EXGL_EXGLContextDrawEnded
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextDrawEnded__Legacy(exglCtxId);
}

#ifdef __cplusplus
}
#endif
