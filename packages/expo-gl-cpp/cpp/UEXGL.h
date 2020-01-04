#ifndef __UEXGL_H__
#define __UEXGL_H__


#ifdef __ANDROID__
#include <GLES3/gl3.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES3/gl.h>
#endif

#ifdef __cplusplus
#include <functional>
#endif

// NOTE: The symbols exposed by this header are named with a `UEX` prefix rather than an `EX`
//       prefix so that they are unaffected by the automated iOS versioning script when
//       referenced in versioned Objective-C code. The EXGL C/C++ library is not versioned
//       and there is only one copy of its code in the binary form of the Expo application.


#ifdef __cplusplus
extern "C" {
#endif

// Identifies an EXGL context. No EXGL context has the id 0, so that can be
// used as a 'null' value.
typedef unsigned int UEXGLContextId;

// Identifies an EXGL object. EXGL objects represent virtual mappings to underlying OpenGL objects.
// No EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int UEXGLObjectId;

// [JS thread] Create an EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
UEXGLContextId UEXGLContextCreate(long runtime);

#ifdef __cplusplus
// [JS thread] Pass function to cpp that will run GL operations on GL thread
void UEXGLContextSetFlushMethod(UEXGLContextId exglCtxId, std::function<void(void)> flushMethod);
#endif

#ifdef __APPLE__
// Objective-C wrapper for UEXGLContextSetFlushMethod
typedef void(^UEXGLFlushMethodBlock)(void);
void UEXGLContextSetFlushMethodObjc(UEXGLContextId exglCtxId, UEXGLFlushMethodBlock flushMethod);
#endif

// [Any thread] Check whether we should redraw the surface
bool UEXGLContextNeedsRedraw(UEXGLContextId exglCtxId);

// [GL thread] Tell cpp that we finished drawing to the surface
void UEXGLContextDrawEnded(UEXGLContextId exglCtxId);

// [Any thread] Release the resources for an EXGL context. The same id is never
// reused.
void UEXGLContextDestroy(UEXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void UEXGLContextFlush(UEXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void UEXGLContextSetDefaultFramebuffer(UEXGLContextId exglCtxId, GLint framebuffer);

// [Any thread] Create an EXGL object. Initially maps to the OpenGL object zero.
UEXGLObjectId UEXGLContextCreateObject(UEXGLContextId exglCtxId);

// [GL thread] Destroy an EXGL object.
void UEXGLContextDestroyObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an EXGL object maps to.
void UEXGLContextMapObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj);

// [GL thread] Get the underlying OpenGL object an EXGL object maps to.
GLuint UEXGLContextGetObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId);

#ifdef __cplusplus
}
#endif


#endif
