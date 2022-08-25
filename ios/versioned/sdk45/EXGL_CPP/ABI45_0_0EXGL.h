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

// NOTE: The symbols exposed by this header are named with a `UEX` prefix rather than an `ABI45_0_0EX`
//       prefix so that they are unaffected by the automated iOS versioning script when
//       referenced in versioned Objective-C code. The ABI45_0_0EXGL C/C++ library is not versioned
//       and there is only one copy of its code in the binary form of the Expo application.

#ifdef __cplusplus
extern "C" {
#endif

// Identifies an ABI45_0_0EXGL context. No ABI45_0_0EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int ABI45_0_0EXGLContextId;

// Identifies an ABI45_0_0EXGL object. ABI45_0_0EXGL objects represent virtual mappings to underlying OpenGL objects.
// No ABI45_0_0EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int ABI45_0_0EXGLObjectId;

ABI45_0_0EXGLContextId ABI45_0_0EXGLContextCreate();

#ifdef __cplusplus
#endif

#ifdef __APPLE__
// Objective-C wrapper for ABI45_0_0EXGLContextSetFlushMethod
typedef void (^ABI45_0_0EXGLFlushMethodBlock)(void);
// [JS thread] Create an ABI45_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI45_0_0EXGLContextPrepare(void *runtime, ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLFlushMethodBlock flushMethod);

#else
// [JS thread] Create an ABI45_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI45_0_0EXGLContextPrepare(void *runtime, ABI45_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif

// [Any thread] Check whether we should redraw the surface
bool ABI45_0_0EXGLContextNeedsRedraw(ABI45_0_0EXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void ABI45_0_0EXGLContextDrawEnded(ABI45_0_0EXGLContextId exglCtxId);

// [Any thread] Release the resources for an ABI45_0_0EXGL context. The same id is never
// reused.
void ABI45_0_0EXGLContextDestroy(ABI45_0_0EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void ABI45_0_0EXGLContextFlush(ABI45_0_0EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void ABI45_0_0EXGLContextSetDefaultFramebuffer(ABI45_0_0EXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an ABI45_0_0EXGL object. Initially maps to the OpenGL object zero.
ABI45_0_0EXGLObjectId ABI45_0_0EXGLContextCreateObject(ABI45_0_0EXGLContextId exglCtxId);

// [GL thread] Destroy an ABI45_0_0EXGL object.
void ABI45_0_0EXGLContextDestroyObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an ABI45_0_0EXGL object maps to.
void ABI45_0_0EXGLContextMapObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an ABI45_0_0EXGL object maps to.
GLuint ABI45_0_0EXGLContextGetObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif

#endif
