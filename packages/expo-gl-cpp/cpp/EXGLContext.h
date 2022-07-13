#pragma once

#include "UEXGL.h"

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/EAGL.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#endif

#include "TypedArrayApi.h"

#include <exception>
#include <future>
#include <set>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <jsi/jsi.h>

#include "EXJsiUtils.h"
#include "EXPlatformUtils.h"
#include "EXWebGLRenderer.h"
#include "TypedArrayApi.h"

// Constants in WebGL that aren't in OpenGL ES
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants

#define GL_UNPACK_FLIP_Y_WEBGL 0x9240
#define GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL 0x9241
#define GL_CONTEXT_LOST_WEBGL 0x9242
#define GL_UNPACK_COLORSPACE_CONVERSION_WEBGL 0x9243
#define GL_BROWSER_DEFAULT_WEBGL 0x9244
#define GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL 0x9247

#define GL_STENCIL_INDEX 0x1901
#define GL_DEPTH_STENCIL 0x84F9
#define GL_DEPTH_STENCIL_ATTACHMENT 0x821A

namespace expo {
namespace gl_cpp {

class EXGLContext {
  using Op = std::function<void(void)>;
  using Batch = std::vector<Op>;

 public:
  EXGLContext(UEXGLContextId ctxId): ctxId(ctxId) {}
  void prepareContext(jsi::Runtime &runtime, std::function<void(void)> flushMethod);
  void maybePrepareWorkletContext(jsi::Runtime &runtime, initGlesContext viewport);

  // --- Queue handling --------------------------------------------------------

  // There are two threads: the input thread (henceforth "JS thread") feeds new GL
  // work, the output thread (henceforth "GL thread", typically UI thread on iOS,
  // GL thread on Android) reads GL work and performs it

  // Ops are combined into batches:
  //   1. A batch is always executed entirely in one go on the GL thread
  //   2. The last add to a batch always precedes the first remove
  // #2 means that it's good to use an std::vector<...> for this

  // [JS thread] Send the current 'next' batch to GL and make a new 'next' batch
  void endNextBatch() noexcept;
  // [JS thread] Add an Op to the 'next' batch
  void addToNextBatch(Op &&op) noexcept;
  // [JS thread] Add a blocking operation to the 'next' batch -- waits for the
  // queued function to run before returning
  void addBlockingToNextBatch(Op &&op);

  // [JS thread] Enqueue a function and return an EXGL object that will get mapped
  // to the function's return value when it is called on the GL thread.
  //
  // We call these 'futures': a return value from a GL method call that is simply
  // fed to other GL method calls. The value is never inspected in JS. This
  // allows us to continue queueing method calls when a method call with a
  // 'future' return value is encountered: its value won't immediately matter
  // and is only needed when method calls after it ask for the value, and those
  // are queued for even later.
  //
  // To make it work lookupObject can be called only on GL thread
  //
  jsi::Value addFutureToNextBatch(
      jsi::Runtime &runtime,
      std::function<unsigned int(void)> &&op) noexcept;

  // [GL thread] Do all the remaining work we can do on the GL thread
  // triggered by call to flushOnGLThread
  void flush(void);

  // --- Object mapping --------------------------------------------------------

  // We err on the side of performance and hope that a global incrementing atomic
  // unsigned int is enough for object ids. On 'creating' an object we simply
  // 'reserve' the id by incrementing the atomic counter. Since the mapping is only
  // set and read on the GL thread, this prevents us from having to maintain a
  // mutex on the mapping.

  UEXGLObjectId createObject(void) noexcept;
  void destroyObject(UEXGLObjectId exglObjId) noexcept;
  void mapObject(UEXGLObjectId exglObjId, GLuint glObj) noexcept;
  GLuint lookupObject(UEXGLObjectId exglObjId) noexcept;

  void tryRegisterOnJSRuntimeDestroy(jsi::Runtime &runtime);
  initGlesContext prepareOpenGLESContext();
  void maybeReadAndCacheSupportedExtensions();

 private:
  // Queue
  Batch nextBatch;
  std::vector<Batch> backlog;
  std::mutex backlogMutex;

 public:
  UEXGLContextId ctxId;

  // Object mapping
  std::unordered_map<UEXGLObjectId, GLuint> objects;
  std::atomic_uint nextObjectId = 1;

  bool supportsWebGL2 = false;
  std::set<const std::string> supportedExtensions;

  // function that calls flush on GL thread - on Android it is passed by JNI
  std::function<void(void)> flushOnGLThread = [&] {};

  // OpenGLES state
  bool needsRedraw = false;
  GLint defaultFramebuffer = 0;
  bool unpackFLipY = false;
};

} // namespace gl_cpp
} // namespace expo
