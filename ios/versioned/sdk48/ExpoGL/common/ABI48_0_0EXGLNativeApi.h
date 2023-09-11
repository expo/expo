#ifndef __EXGL_H__
#define __EXGL_H__

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES3/gl.h>
#endif

#ifdef __cplusplus
#include <functional>
#else
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

// Identifies an ABI48_0_0EXGL context. No ABI48_0_0EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int ABI48_0_0EXGLContextId;

// Identifies an ABI48_0_0EXGL object. ABI48_0_0EXGL objects represent virtual mappings to underlying OpenGL objects.
// No ABI48_0_0EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int ABI48_0_0EXGLObjectId;

ABI48_0_0EXGLContextId ABI48_0_0EXGLContextCreate();

#ifdef __cplusplus
// [JS thread] Create an ABI48_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI48_0_0EXGLContextPrepare(void *runtime, ABI48_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif // __cplusplus

// [Any thread] Check whether we should redraw the surface
bool ABI48_0_0EXGLContextNeedsRedraw(ABI48_0_0EXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void ABI48_0_0EXGLContextDrawEnded(ABI48_0_0EXGLContextId exglCtxId);

// [Any thread] Release the resources for an ABI48_0_0EXGL context. The same id is never
// reused.
void ABI48_0_0EXGLContextDestroy(ABI48_0_0EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void ABI48_0_0EXGLContextFlush(ABI48_0_0EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void ABI48_0_0EXGLContextSetDefaultFramebuffer(ABI48_0_0EXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an ABI48_0_0EXGL object. Initially maps to the OpenGL object zero.
ABI48_0_0EXGLObjectId ABI48_0_0EXGLContextCreateObject(ABI48_0_0EXGLContextId exglCtxId);

// [GL thread] Destroy an ABI48_0_0EXGL object.
void ABI48_0_0EXGLContextDestroyObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an ABI48_0_0EXGL object maps to.
void ABI48_0_0EXGLContextMapObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an ABI48_0_0EXGL object maps to.
GLuint ABI48_0_0EXGLContextGetObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif

#endif
