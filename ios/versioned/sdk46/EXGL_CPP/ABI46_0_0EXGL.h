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

// NOTE: The symbols exposed by this header are named with a `UEX` prefix rather than an `ABI46_0_0EX`
//       prefix so that they are unaffected by the automated iOS versioning script when
//       referenced in versioned Objective-C code. The ABI46_0_0EXGL C/C++ library is not versioned
//       and there is only one copy of its code in the binary form of the Expo application.

#ifdef __cplusplus
extern "C" {
#endif

// Identifies an ABI46_0_0EXGL context. No ABI46_0_0EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int ABI46_0_0EXGLContextId;

// Identifies an ABI46_0_0EXGL object. ABI46_0_0EXGL objects represent virtual mappings to underlying OpenGL objects.
// No ABI46_0_0EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int ABI46_0_0EXGLObjectId;

ABI46_0_0EXGLContextId ABI46_0_0EXGLContextCreate();

#ifdef __cplusplus
#endif

#ifdef __APPLE__
// Objective-C wrapper for ABI46_0_0EXGLContextSetFlushMethod
typedef void (^ABI46_0_0EXGLFlushMethodBlock)(void);
// [JS thread] Create an ABI46_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI46_0_0EXGLContextPrepare(void *runtime, ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLFlushMethodBlock flushMethod);

#else
// [JS thread] Create an ABI46_0_0EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
void ABI46_0_0EXGLContextPrepare(void *runtime, ABI46_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif

// [Any thread] Check whether we should redraw the surface
bool ABI46_0_0EXGLContextNeedsRedraw(ABI46_0_0EXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void ABI46_0_0EXGLContextDrawEnded(ABI46_0_0EXGLContextId exglCtxId);

// [Any thread] Release the resources for an ABI46_0_0EXGL context. The same id is never
// reused.
void ABI46_0_0EXGLContextDestroy(ABI46_0_0EXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void ABI46_0_0EXGLContextFlush(ABI46_0_0EXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void ABI46_0_0EXGLContextSetDefaultFramebuffer(ABI46_0_0EXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an ABI46_0_0EXGL object. Initially maps to the OpenGL object zero.
ABI46_0_0EXGLObjectId ABI46_0_0EXGLContextCreateObject(ABI46_0_0EXGLContextId exglCtxId);

// [GL thread] Destroy an ABI46_0_0EXGL object.
void ABI46_0_0EXGLContextDestroyObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an ABI46_0_0EXGL object maps to.
void ABI46_0_0EXGLContextMapObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an ABI46_0_0EXGL object maps to.
GLuint ABI46_0_0EXGLContextGetObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif

#endif
