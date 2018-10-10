package expo.modules.gl;

import static expo.modules.gl.cpp.EXGL.*;

public class GLObject {
  protected int exglCtxId;
  protected int exglObjId;

  GLObject(int exglCtxId) {
    // Generic
    this.exglCtxId = exglCtxId;
    this.exglObjId = EXGLContextCreateObject(exglCtxId);
  }

  int getEXGLObjId() {
    return exglObjId;
  }

  void destroy() {
    EXGLContextDestroyObject(exglCtxId, exglObjId);
  }
}
