package host.exp.exponent.exgl;

import com.facebook.soloader.SoLoader;

// Java bindings for EXGL.h interface
public class EXGL {
  static {
    SoLoader.loadLibrary("exponent");
  }
  public static native int EXGLContextCreate(long jsCtx);
  public static native void EXGLContextDestroy(int exglCtxId);
  public static native void EXGLContextFlush(int exglCtxId);
}
