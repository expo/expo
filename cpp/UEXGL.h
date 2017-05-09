#ifndef __UEXGL_H__
#define __UEXGL_H__


#ifdef __ANDROID__
#include <GLES2/gl2.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES2/gl.h>
#endif

#include <JavaScriptCore/JSBase.h>


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

// [JS thread] Create an EXGL context and return its id number. Saves the
// JavaScript interface object (has a WebGLRenderingContext-style API) at
// `global.__EXGLContexts[id]` in JavaScript.
UEXGLContextId UEXGLContextCreate(JSGlobalContextRef jsCtx);

// [Any thread] Release the resources for an EXGL context. The same id is never
// reused.
void UEXGLContextDestroy(UEXGLContextId exglCtxId);

// [GL thread] Perform one frame's worth of queued up GL work
void UEXGLContextFlush(UEXGLContextId exglCtxId);

// [GL thread] Set the default framebuffer (used when binding 0). Allows using
// platform-specific extensions on the default framebuffer, such as MSAA.
void UEXGLContextSetDefaultFramebuffer(UEXGLContextId exglCtxId, GLint framebuffer);


// Identifies an EXGL object. EXGL objects represent virtual mappings to underlying OpenGL objects.
// No EXGL object has the id 0, so that can be used as a 'null' value.
typedef unsigned int UEXGLObjectId;

// [Any thread] Create an EXGL object. Initially maps to the OpenGL object zero.
UEXGLObjectId UEXGLContextCreateObject(UEXGLContextId exglCtxId);

// [GL thread] Destroy an EXGL object.
void UEXGLContextDestroyObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId);

// [GL thread] Set the underlying OpenGL object an EXGL object maps to.
void UEXGLContextMapObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj);

#ifdef __cplusplus
}
#endif


#endif
