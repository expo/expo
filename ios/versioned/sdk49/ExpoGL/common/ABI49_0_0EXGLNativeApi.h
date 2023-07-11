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

// Identifies an ABI49_0_0EXGL context. No ABI49_0_0EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int ABI49_0_0EXGLContextId;

// Identifies an ABI49_0_0EXGL object. ABI49_0_0EXGL objects represent virtual mappings to underlying OpenGL objects.
// No ABI49_0_0EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int ABI49_0_0EXGLObjectId;

ABI49_0_0EXGLContextId ABI49_0_0EXGLContextCreate();

#ifdef __cplusplus
// [JS thread] Create an ABI49_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI49_0_0EXGLContextPrepare(void *runtime, ABI49_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif // __cplusplus

// [UI thread] Creates an ABI49_0_0EXGL context inside Reanimated worklet.
void ABI49_0_0EXGLContextPrepareWorklet(ABI49_0_0EXGLContextId exglCtxId);

// [Any thread] Check whether we should redraw the surface
bool ABI49_0_0EXGLContextNeedsRedraw(ABI49_0_0EXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void ABI49_0_0EXGLContextDrawEnded(ABI49_0_0EXGLContextId exglCtxId);

// [Any thread] Release the resources for an ABI49_0_0EXGL context. The same id is never
// reused.
void ABI49_0_0EXGLContextDestroy(ABI49_0_0EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void ABI49_0_0EXGLContextFlush(ABI49_0_0EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void ABI49_0_0EXGLContextSetDefaultFramebuffer(ABI49_0_0EXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an ABI49_0_0EXGL object. Initially maps to the OpenGL object zero.
ABI49_0_0EXGLObjectId ABI49_0_0EXGLContextCreateObject(ABI49_0_0EXGLContextId exglCtxId);

// [GL thread] Destroy an ABI49_0_0EXGL object.
void ABI49_0_0EXGLContextDestroyObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an ABI49_0_0EXGL object maps to.
void ABI49_0_0EXGLContextMapObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an ABI49_0_0EXGL object maps to.
GLuint ABI49_0_0EXGLContextGetObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif

#endif
