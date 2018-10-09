package expo.modules.gl;

import static expo.modules.gl.cpp.EXGL.*;

public class GLObject {
  protected int exglCtxId;
  protected int exglObjId;

  public GLObject(int exglCtxId) {
    // Generic
    this.exglCtxId = exglCtxId;
    this.exglObjId = EXGLContextCreateObject(exglCtxId);
  }

  int getEXGLObjId() {
    return exglObjId;
  }

  public void destroy() {
    EXGLContextDestroyObject(exglCtxId, exglObjId);
  }
}
