#ifndef __EXGL_H__
#define __EXGL_H__


#include <OpenGLES/ES2/gl.h>
#include <JavaScriptCore/JSBase.h>


#ifdef __cplusplus
extern "C" {
#endif

// Identifies an EXGL context. No EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int EXGLContextId;

// [JS thread] Create an EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
EXGLContextId EXGLContextCreate(JSGlobalContextRef jsCtx);

// [Any thread] Release the resources for an EXGL context. The same id is never
// reused.
void EXGLContextDestroy(EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void EXGLContextFlush(EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0)
void EXGLContextSetDefaultFramebuffer(EXGLContextId exglCtxId, GLint framebuffer);

#ifdef __cplusplus
}
#endif


#endif
