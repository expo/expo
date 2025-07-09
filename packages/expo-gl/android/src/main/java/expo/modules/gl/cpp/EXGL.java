package expo.modules.gl.cpp;

import com.facebook.soloader.SoLoader;

// Java bindings for EXGLNativeApi.h interface
public class EXGL {
  static {
    SoLoader.loadLibrary("expo-gl");
  }
  public static native int EXGLContextCreate();
  public static native void EXGLContextPrepare(long jsCtxPtr, int exglCtxId, Object glContext);
  public static native void EXGLContextPrepareWorklet(int exglCtxId);

  public static native void EXGLContextDestroy(int exglCtxId);
  public static native void EXGLContextFlush(int exglCtxId);

  public static native int EXGLContextCreateObject(int exglCtxId);
  public static native void EXGLContextDestroyObject(int exglCtxId, int exglObjId);
  public static native void EXGLContextMapObject(int exglCtxId, int exglObjId, int glObj);
  public static native int EXGLContextGetObject(int exglCtxId, int exglObjId);
  public static native boolean EXGLContextNeedsRedraw(int exglCtxId);
  public static native void EXGLContextDrawEnded(int exglCtxId);
}
