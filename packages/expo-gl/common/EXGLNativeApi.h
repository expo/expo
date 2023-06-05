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

// Identifies an EXGL context. No EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int EXGLContextId;

// Identifies an EXGL object. EXGL objects represent virtual mappings to underlying OpenGL objects.
// No EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int EXGLObjectId;

EXGLContextId EXGLContextCreate();

#ifdef __cplusplus
// [JS thread] Create an EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void EXGLContextPrepare(void *runtime, EXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif // __cplusplus

// [UI thread] Creates an EXGL context inside Reanimated worklet.
void EXGLContextPrepareWorklet(EXGLContextId exglCtxId);

// [Any thread] Check whether we should redraw the surface
bool EXGLContextNeedsRedraw(EXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void EXGLContextDrawEnded(EXGLContextId exglCtxId);

// [Any thread] Release the resources for an EXGL context. The same id is never
// reused.
void EXGLContextDestroy(EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void EXGLContextFlush(EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void EXGLContextSetDefaultFramebuffer(EXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an EXGL object. Initially maps to the OpenGL object zero.
EXGLObjectId EXGLContextCreateObject(EXGLContextId exglCtxId);

// [GL thread] Destroy an EXGL object.
void EXGLContextDestroyObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an EXGL object maps to.
void EXGLContextMapObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an EXGL object maps to.
GLuint EXGLContextGetObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif

#endif
