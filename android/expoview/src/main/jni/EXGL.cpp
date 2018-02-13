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
Java_host_exp_exponent_exgl_EXGL_EXGLContextCreate
(JNIEnv *env, jclass clazz, jlong jsCtxPtr) {
  JSGlobalContextRef jsCtx = (JSGlobalContextRef) (intptr_t) jsCtxPtr;
  if (jsCtx) {
    return UEXGLContextCreate(jsCtx);
  }
  return 0;
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextDestroy
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextDestroy(exglCtxId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextFlush
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextFlush(exglCtxId);
}

JNIEXPORT jint JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextCreateObject
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  return UEXGLContextCreateObject(exglCtxId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextDestroyObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId) {
  UEXGLContextDestroyObject(exglCtxId, exglObjId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextMapObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId, jint glObj) {
  UEXGLContextMapObject(exglCtxId, exglObjId, glObj);
}

JNIEXPORT jint JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextGetObject
(JNIEnv *env, jclass clazz, jint exglCtxId, jint exglObjId) {
  return UEXGLContextGetObject(exglCtxId, exglObjId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextSetFlushMethod
(JNIEnv *env, jclass clazz, jint exglCtxId, jobject glView) {
  jclass GLViewClass = env->GetObjectClass(glView);
  jobject glViewRef = env->NewGlobalRef(glView);
  jmethodID flushMethodRef = env->GetMethodID(GLViewClass, "flush", "()V");

  std::function<void(void)> flushMethod = [env, glViewRef, flushMethodRef, exglCtxId] {
    env->CallVoidMethod(glViewRef, flushMethodRef);
  };
  UEXGLContextSetFlushMethod(exglCtxId, flushMethod);
}

JNIEXPORT bool JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextNeedsRedraw
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  return UEXGLContextNeedsRedraw(exglCtxId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextDrawEnded
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  UEXGLContextDrawEnded(exglCtxId);
}

#ifdef __cplusplus
}
#endif
