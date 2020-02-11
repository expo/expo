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

#include <exception>
#include <future>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <jsi/jsi.h>

#include "EXGLNativeMethodsUtils.h"
#include "EXJSIUtils.h"

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

// --- EXGLContext -------------------------------------------------------------

// Class of the C++ object representing an EXGL rendering context.

class EXGLContext {
  // --- Queue handling --------------------------------------------------------

  // There are two threads: the input thread (henceforth "JS thread") feeds new GL
  // work, the output thread (henceforth "GL thread", typically UI thread on iOS,
  // GL thread on Android) reads GL work and performs it

  // By not saving the JS{Global,}Context as a member variable we ensure that no
  // JS work is done on the GL thread

 private:
  // The smallest unit of work
  using Op = std::function<void(void)>;

  // Ops are combined into batches:
  //   1. A batch is always executed entirely in one go on the GL thread
  //   2. The last add to a batch always precedes the first remove
  // #2 means that it's good to use an std::vector<...> for this
  using Batch = std::vector<Op>;

  Batch nextBatch;
  std::vector<Batch> backlog;
  std::mutex backlogMutex;

  // [JS thread] Send the current 'next' batch to GL and make a new 'next' batch
  void endNextBatch() noexcept {
    std::lock_guard<std::mutex> lock(backlogMutex);
    backlog.push_back(std::move(nextBatch));
    nextBatch = std::vector<Op>();
    nextBatch.reserve(16); // default batch size
  }

  // [JS thread] Add an Op to the 'next' batch -- the arguments are any form of
  // constructor arguments for Op
  void addToNextBatch(Op &&op) noexcept {
    nextBatch.push_back(std::move(op));
  }

  // [JS thread] Add a blocking operation to the 'next' batch -- waits for the
  // queued function to run before returning
  void addBlockingToNextBatch(Op &&op) noexcept {
    std::packaged_task<void(void)> task(std::move(op));
    auto future = task.get_future();
    addToNextBatch([&] { task(); });
    endNextBatch();
    flushOnGLThread();
    future.wait();
  }

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
  inline jsi::Value addFutureToNextBatch(
      jsi::Runtime &runtime,
      std::function<unsigned int(void)> &&op) noexcept {
    auto exglObjId = createObject();
    addToNextBatch([=] {
      assert(objects.find(exglObjId) == objects.end());
      mapObject(exglObjId, op());
    });
    return static_cast<double>(exglObjId);
  }

 public:
  // function that calls flush on GL thread - on Android it is passed by JNI
  std::function<void(void)> flushOnGLThread = [&] {};

  // [GL thread] Do all the remaining work we can do on the GL thread
  void flush(void) {
    // Keep a copy and clear backlog to minimize lock time
    std::vector<Batch> copy;
    {
      std::lock_guard<std::mutex> lock(backlogMutex);
      std::swap(backlog, copy);
    }
    for (const auto &batch : copy) {
      for (const auto &op : batch) {
        op();
      }
    }
  }

  // --- Object mapping --------------------------------------------------------

  // We err on the side of performance and hope that a global incrementing atomic
  // unsigned int is enough for object ids. On 'creating' an object we simply
  // 'reserve' the id by incrementing the atomic counter. Since the mapping is only
  // set and read on the GL thread, this prevents us from having to maintain a
  // mutex on the mapping.

 private:
  std::unordered_map<UEXGLObjectId, GLuint> objects;
  static std::atomic_uint nextObjectId;

 public:
  inline UEXGLObjectId createObject(void) noexcept {
    return nextObjectId++;
  }

  inline void destroyObject(UEXGLObjectId exglObjId) noexcept {
    objects.erase(exglObjId);
  }

  inline void mapObject(UEXGLObjectId exglObjId, GLuint glObj) noexcept {
    objects[exglObjId] = glObj;
  }

  inline GLuint lookupObject(UEXGLObjectId exglObjId) noexcept {
    auto iter = objects.find(exglObjId);
    return iter == objects.end() ? 0 : iter->second;
  }

  // --- Init/destroy and JS object binding ------------------------------------
 private:
  bool supportsWebGL2 = false;

 public:
  EXGLContext(jsi::Runtime &runtime, UEXGLContextId exglCtxId) {
    jsi::Object jsGl(runtime);
    jsGl.setProperty(
        runtime, jsi::PropNameID::forUtf8(runtime, "exglCtxId"), static_cast<double>(exglCtxId));
    installMethods(runtime, jsGl, exglCtxId);
    installConstants(runtime, jsGl);

    // Save JavaScript object
    jsi::Value jsContextMap = runtime.global().getProperty(runtime, "__EXGLContexts");
    if (jsContextMap.isNull() || jsContextMap.isUndefined()) {
      runtime.global().setProperty(runtime, "__EXGLContexts", jsi::Object(runtime));
    }
    runtime.global()
        .getProperty(runtime, "__EXGLContexts")
        .asObject(runtime)
        .setProperty(runtime, jsi::PropNameID::forUtf8(runtime, std::to_string(exglCtxId)), jsGl);

    // Clear everything to initial values
    addToNextBatch([this] {
      std::string version = reinterpret_cast<const char *>(glGetString(GL_VERSION));
      double glesVersion = strtod(version.substr(10).c_str(), 0);
      this->supportsWebGL2 = glesVersion >= 3.0;

      glBindFramebuffer(GL_FRAMEBUFFER, defaultFramebuffer);
      GLenum status = glCheckFramebufferStatus(GL_FRAMEBUFFER);

      // This should not be called on headless contexts as they don't have default framebuffer.
      // On headless context, status is undefined.
      if (status != GL_FRAMEBUFFER_UNDEFINED) {
        glClearColor(0, 0, 0, 0);
        glClearDepthf(1);
        glClearStencil(0);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
      } else {
        // Set up an initial viewport for headless context.
        // These values are the same as newly created WebGL context has,
        // however they should be changed by the user anyway.
        glViewport(0, 0, 300, 150);
      }
    });
  }

  static EXGLContext *ContextGet(UEXGLContextId exglCtxId);
  static UEXGLContextId ContextCreate(jsi::Runtime &runtime);
  static void ContextDestroy(UEXGLContextId exglCtxId);

  // --- GL state --------------------------------------------------------------
 private:
  GLint defaultFramebuffer = 0;
  bool unpackFLipY = false;

 public:
  bool needsRedraw = false;

  void setDefaultFramebuffer(GLint framebuffer) {
    defaultFramebuffer = framebuffer;
  }

  void setNeedsRedraw(bool needsRedraw) {
    this->needsRedraw = needsRedraw;
  }

 private:
  // functions used to setup WebGLRenderer object (attaching methods and constants)

  void installMethods(jsi::Runtime &runtime, jsi::Object &jsGl, UEXGLContextId exglCtxId);
  void installConstants(jsi::Runtime &runtime, jsi::Object &jsGl);

  //  helpers used in implementation of some of the glNativeMethod_#name

  template <typename Func, typename... T>
  inline jsi::Value exglCall(Func func, T &&... args);

  template <typename Func>
  inline jsi::Value exglGetActiveInfo(jsi::Runtime &, UEXGLObjectId, GLuint, GLenum, Func);

  template <typename Func, typename T>
  inline jsi::Value exglUniformv(Func, GLuint, size_t, std::vector<T> &&);
  template <typename Func, typename T>
  inline jsi::Value exglUniformMatrixv(Func, GLuint, GLboolean, size_t, std::vector<T> &&);
  template <typename Func, typename T>
  inline jsi::Value exglVertexAttribv(Func func, GLuint, std::vector<T> &&);

  jsi::Value exglIsObject(UEXGLObjectId id, std::function<GLboolean(GLuint)>);
  jsi::Value exglCreateObject(jsi::Runtime &, std::function<GLuint()>);
  jsi::Value exglGenObject(jsi::Runtime &, std::function<void(GLsizei, UEXGLObjectId *)>);
  jsi::Value exglDeleteObject(UEXGLObjectId id, std::function<void(UEXGLObjectId)>);
  jsi::Value exglDeleteObject(UEXGLObjectId, std::function<void(GLsizei, const UEXGLObjectId *)>);

  jsi::Value exglUnimplemented(std::string name);

  // implementation of webgl methods (glNativeMethod_#name)
  // called on JS Thread
#define NATIVE_METHOD(name) \
  jsi::Value glNativeMethod_##name(jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t);
#define NATIVE_WEBGL2_METHOD(name) NATIVE_METHOD(name)
#include "EXGLNativeMethods.def"
#undef NATIVE_METHOD
#undef NATIVE_WEBGL2_METHOD
};

#include "EXGLContext-inl.h"
