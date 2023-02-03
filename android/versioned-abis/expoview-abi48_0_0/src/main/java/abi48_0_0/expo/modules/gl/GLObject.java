package abi48_0_0.expo.modules.gl;

import static abi48_0_0.expo.modules.gl.cpp.EXGL.*;

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
