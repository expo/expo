#include <stdint.h>

#include <jni.h>

#include <JavaScriptCore/JSContextRef.h>


#include "EXGL.h"


JNIEXPORT jint JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextCreate
(JNIEnv *env, jclass clazz, jlong jsCtxL) {
  JSGlobalContextRef jsCtx = (JSGlobalContextRef) (intptr_t) jsCtxL;
  if (jsCtx) {
    return EXGLContextCreate(jsCtx);
  }
  return 0;
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextDestroy
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  EXGLContextDestroy(exglCtxId);
}

JNIEXPORT void JNICALL
Java_host_exp_exponent_exgl_EXGL_EXGLContextFlush
(JNIEnv *env, jclass clazz, jint exglCtxId) {
  EXGLContextFlush(exglCtxId);
}

