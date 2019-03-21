#include "UEXGL.h"

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#include <OpenGLES/EAGL.h>
#endif

#include <exception>
#include <future>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>


#include "EXJSUtils.h"
#include "EXJSConvertTypedArray.h"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#ifdef __APPLE__
#include "EXiOSUtils.h"
#endif


// Debugging utilities

#define EXGL_DEBUG     // Whether debugging is on

#ifdef EXGL_DEBUG
#ifdef __ANDROID__
#define EXGLSysLog(fmt, ...) __android_log_print(ANDROID_LOG_DEBUG, "EXGL", fmt, ##__VA_ARGS__)
#endif
#ifdef __APPLE__
#define EXGLSysLog(fmt, ...) EXiOSLog("EXGL: " fmt, ##__VA_ARGS__)
#endif
#else
#define EXGLSysLog(...)
#endif


// Forward declarations

class EXGLContext;
static EXGLContext *EXGLContextGet(UEXGLContextId exglCtxId);


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
    std::lock_guard<decltype(backlogMutex)> lock(backlogMutex);
    backlog.emplace_back();
    backlog.back().reserve(nextBatch.size());
    backlog.back().swap(nextBatch);
  }

  // [JS thread] Add an Op to the 'next' batch -- the arguments are any form of
  // constructor arguments for Op
  template<typename... Args>
  inline void addToNextBatch(Args &&...args) noexcept {
    nextBatch.emplace_back(std::forward<Args>(args)...);
  }

  // [JS thread] Add a blocking operation to the 'next' batch -- waits for the
  // queued function to run before returning
  template<typename F>
  inline void addBlockingToNextBatch(F &&f) noexcept {
#ifdef __ANDROID__
    // std::packaged_task + std::future segfaults on Android... :|

    std::mutex mutex;
    std::condition_variable cv;
    auto done = false;

    addToNextBatch([&] {
      f();
      {
        std::lock_guard<decltype(mutex)> lock(mutex);
        done = true;
      }
      cv.notify_all();
    });

    {
      std::unique_lock<decltype(mutex)> lock(mutex);
      endNextBatch();
      flushOnGLThread();
      cv.wait(lock, [&] { return done; });
    }
#else
    std::packaged_task<decltype(f())(void)> task(std::move(f));
    auto future = task.get_future();
    addToNextBatch([&] { task(); });
    endNextBatch();
    flushOnGLThread();
    future.wait();
#endif
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
  template<typename F>
  inline JSValueRef addFutureToNextBatch(JSContextRef jsCtx, F &&f) noexcept {
    auto exglObjId = createObject();
    addToNextBatch([=] {
      assert(objects.find(exglObjId) == objects.end());
      mapObject(exglObjId, f());
    });
    return JSValueMakeNumber(jsCtx, exglObjId);
  }

public:
  // function that calls flush on GL thread - on Android it is passed by JNI
  std::function<void(void)> flushOnGLThread = [&]{};
  
  // [GL thread] Do all the remaining work we can do on the GL thread
  void flush(void) noexcept {
    // Keep a copy and clear backlog to minimize lock time
    decltype(backlog) copy;
    {
      std::lock_guard<decltype(backlogMutex)> lock(backlogMutex);
      backlog.swap(copy);
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
  JSObjectRef jsGl;
  bool supportsWebGL2 = false;

public:
  EXGLContext(JSGlobalContextRef jsCtx, UEXGLContextId exglCtxId) {
    // Prepare for TypedArray usage
    prepareTypedArrayAPI(jsCtx);

    // Create JS version of us
    auto jsClass = JSClassCreate(&kJSClassDefinitionEmpty);
    jsGl = JSObjectMake(jsCtx, jsClass, (void *) (intptr_t) exglCtxId);
    JSClassRelease(jsClass);
    installMethods(jsCtx);
    installConstants(jsCtx);

    // Clear everything to initial values
    addToNextBatch([this] {
      std::string version = (char *) glGetString(GL_VERSION);
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

  JSObjectRef getJSObject(void) const noexcept {
    return jsGl;
  }


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


  // --- Actual GL bindings ----------------------------------------------------
private:

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


  // Utilities

  static inline void jsThrow(JSContextRef jsCtx, const char *msg, JSValueRef *jsException) {
    *jsException = JSValueToObject(jsCtx, EXJSValueMakeStringFromUTF8CString(jsCtx, msg), nullptr);
  }

  static inline std::shared_ptr<char> jsValueToSharedStr(JSContextRef jsCtx, JSValueRef jsVal) noexcept {
    return std::shared_ptr<char>(EXJSValueToUTF8CStringMalloc(jsCtx, jsVal, nullptr), free);
  }

  static inline int jsArrayGetCount(JSContextRef ctx, JSObjectRef arr) noexcept {
    JSStringRef pname = JSStringCreateWithUTF8CString("length");
    JSValueRef val = JSObjectGetProperty(ctx, arr, pname, nullptr);
    JSStringRelease(pname);
    return JSValueToNumber(ctx, val, nullptr);
  }

  static inline std::shared_ptr<const char*> jsValueToSharedStringArray(JSContextRef ctx, JSValueRef jsVal, int *length) {
    JSObjectRef jsObj = JSValueToObject(ctx, jsVal, nullptr);
    *length = jsArrayGetCount(ctx, jsObj);
    const char **strings = (const char **) malloc(*length * sizeof(char*));

    for (int i = 0; i < *length; i++) {
      JSValueRef item = JSObjectGetPropertyAtIndex(ctx, jsObj, i, nullptr);
      strings[i] = EXJSValueToUTF8CStringMalloc(ctx, item, nullptr);
    }
    return std::shared_ptr<const char*>(strings, free);
  }

  static inline void *bufferOffset(GLint offset) noexcept {
    return (char *) 0 + offset;
  }

  static inline GLuint bytesPerPixel(GLenum type, GLenum format) {
    int bytesPerComponent = 0;
    switch (type) {
      case GL_UNSIGNED_BYTE:
        bytesPerComponent = 1;
        break;
      case GL_FLOAT:
        bytesPerComponent = 4;
        break;
      case GL_HALF_FLOAT:
        bytesPerComponent = 2;
        break;
      case GL_UNSIGNED_SHORT_5_6_5:
      case GL_UNSIGNED_SHORT_4_4_4_4:
      case GL_UNSIGNED_SHORT_5_5_5_1:
        return 2;
    }

    switch (format) {
      case GL_LUMINANCE:
      case GL_ALPHA:
        return 1 * bytesPerComponent;
      case GL_LUMINANCE_ALPHA:
        return 2 * bytesPerComponent;
      case GL_RGB:
        return 3 * bytesPerComponent;
      case GL_RGBA:
        return 4 * bytesPerComponent;
    }
    return 0;
  }

  static inline void flipPixels(GLubyte *pixels, size_t bytesPerRow, size_t rows) {
    if (!pixels) {
      return;
    }

    GLuint middle = (GLuint)rows / 2;
    GLuint intsPerRow = (GLuint)bytesPerRow / sizeof(GLuint);
    GLuint remainingBytes = (GLuint)bytesPerRow - intsPerRow * sizeof(GLuint);

    for (GLuint rowTop = 0, rowBottom = (GLuint)rows - 1; rowTop < middle; ++rowTop, --rowBottom) {
      // Swap in packs of sizeof(GLuint) bytes
      GLuint *iTop = (GLuint *) (pixels + rowTop * bytesPerRow);
      GLuint *iBottom = (GLuint *) (pixels + rowBottom * bytesPerRow);
      GLuint iTmp;
      GLuint n = intsPerRow;
      do {
        iTmp = *iTop;
        *iTop++ = *iBottom;
        *iBottom++ = iTmp;
      } while(--n > 0);

      // Swap remainder bytes
      GLubyte *bTop = (GLubyte *) iTop;
      GLubyte *bBottom = (GLubyte *) iBottom;
      GLubyte bTmp;
      switch (remainingBytes) {
        case 3: bTmp = *bTop; *bTop++ = *bBottom; *bBottom++ = bTmp;
        case 2: bTmp = *bTop; *bTop++ = *bBottom; *bBottom++ = bTmp;
        case 1: bTmp = *bTop; *bTop = *bBottom; *bBottom = bTmp;
      }
    }
  }


  // TypedArray API wrapping

  bool usingTypedArrayHack = false;

  inline void prepareTypedArrayAPI(JSContextRef jsCtx) {
#ifdef __APPLE__
    // iOS >= 10 has built-in C TypedArray API
    if (EXiOSGetOperatingSystemVersion().majorVersion >= 10) {
      return;
    }
#endif

    JSContextPrepareTypedArrayAPI(jsCtx);
    usingTypedArrayHack = true;
  }

  inline std::shared_ptr<void> jsValueToSharedArray(JSContextRef jsCtx, JSValueRef jsVal,
                                                    size_t *pByteLength) noexcept {
    if (usingTypedArrayHack) {
      return std::shared_ptr<void>(JSObjectGetTypedArrayDataMalloc(jsCtx, (JSObjectRef) jsVal,
                                                                   pByteLength), free);
    } else {
      void *data = nullptr;
      size_t byteLength = 0;
      size_t byteOffset = 0;

      JSObjectRef jsObject = (JSObjectRef) jsVal;
      JSTypedArrayType type = JSValueGetTypedArrayType(jsCtx, jsVal, nullptr);
      if (type == kJSTypedArrayTypeArrayBuffer) {
        byteLength = JSObjectGetArrayBufferByteLength(jsCtx, jsObject, nullptr);
        data = JSObjectGetArrayBufferBytesPtr(jsCtx, jsObject, nullptr);
        byteOffset = 0; // todo: no equivalent function for array buffer?
      } else if (type != kJSTypedArrayTypeNone) {
        byteLength = JSObjectGetTypedArrayByteLength(jsCtx, jsObject, nullptr);
        data = JSObjectGetTypedArrayBytesPtr(jsCtx, jsObject, nullptr);
        byteOffset = JSObjectGetTypedArrayByteOffsetHack(jsCtx, jsObject);
      }

      if (pByteLength) {
        *pByteLength = byteLength;
      }

      // Copy data since it's unclear how long JavaScriptCore's buffer will live
      // TODO(nikki): See if we can just pin/unpin and not copy?
      if (!data) {
        return std::shared_ptr<void>(nullptr);
      }
      void *dataMalloc = malloc(byteLength);
      memcpy(dataMalloc, ((char*) data) + byteOffset, byteLength);
      return std::shared_ptr<void>(dataMalloc, free);
    }
  }

  static void jsTypedArrayFreeDeallocator(void *data, void *ctx) {
    free(data);
  }

  inline JSValueRef makeTypedArray(JSContextRef jsCtx, JSTypedArrayType arrayType,
                                   void *data, size_t byteLength) {
    if (data) {
      if (usingTypedArrayHack) {
        return JSObjectMakeTypedArrayWithData(jsCtx, arrayType, data, byteLength);
      } else {
        void *dataMalloc = malloc(byteLength);
        memcpy(dataMalloc, data, byteLength);
        return JSObjectMakeTypedArrayWithBytesNoCopy(jsCtx, arrayType, dataMalloc, byteLength,
                                                     jsTypedArrayFreeDeallocator, nullptr, nullptr);
      }
    } else {
      if (usingTypedArrayHack) {
        return JSObjectMakeTypedArrayWithHack(jsCtx, arrayType, 0);
      } else {
        return JSObjectMakeTypedArray(jsCtx, arrayType, 0, nullptr);
      }
    }
  }


  // Standard method wrapper, run on JS thread, return a value
#define _WRAP_METHOD_INTERNAL(name, minArgc, requiresWebGL2)            \
  static JSValueRef exglNativeStatic_##name(JSContextRef jsCtx,         \
                                            JSObjectRef jsFunction,     \
                                            JSObjectRef jsThis,         \
                                            size_t jsArgc,              \
                                            const JSValueRef jsArgv[],  \
                                            JSValueRef* jsException)    \
  {                                                                     \
    auto exglCtx = EXGLContextGet((UEXGLContextId) (intptr_t)           \
                                  JSObjectGetPrivate(jsThis));          \
    if (!exglCtx) {                                                     \
      return nullptr;                                                   \
    }                                                                   \
    try {                                                               \
      if (jsArgc < minArgc) {                                           \
        throw std::runtime_error("EXGL: Too few arguments to " #name "()!"); \
      }                                                                 \
      if (requiresWebGL2 && !exglCtx->supportsWebGL2) {                 \
        throw std::runtime_error("EXGL: This device doesn't support WebGL2 method: " #name "()!"); \
      }                                                                 \
      return exglCtx->exglNativeInstance_##name(jsCtx, jsFunction, jsThis, \
                                                jsArgc, jsArgv, jsException); \
    } catch (const std::exception &e) {                                 \
      exglCtx->jsThrow(jsCtx, e.what(), jsException);                   \
      return nullptr;                                                   \
    }                                                                   \
  }                                                                     \
  inline JSValueRef exglNativeInstance_##name(JSContextRef jsCtx,       \
                                              JSObjectRef jsFunction,   \
                                              JSObjectRef jsThis,       \
                                              size_t jsArgc,            \
                                              const JSValueRef jsArgv[], \
                                              JSValueRef* jsException)

#define _WRAP_METHOD(name, minArgc) _WRAP_METHOD_INTERNAL(name, minArgc, false)
#define _WRAP_WEBGL2_METHOD(name, minArgc) _WRAP_METHOD_INTERNAL(name, minArgc, true)

  // Wrapper raises an exception saying the function isn't implemented yet
#define _WRAP_METHOD_UNIMPL(name)                                       \
  _WRAP_METHOD(name, 0) {                                               \
    throw std::runtime_error("EXGL: " #name "() isn't implemented yet!"); \
    return nullptr;                                                     \
  }

  // Wrapper that takes only scalar arguments and returns nothing
#define _WRAP_METHOD_SIMPLE_INTERNAL(name, isWebGL2Method, glFunc, ...) \
  _WRAP_METHOD_INTERNAL(name, EXJS_ARGC(__VA_ARGS__), isWebGL2Method) { \
    addToNextBatch(std::bind(glFunc, EXJS_MAP_EXT(0, _EXJS_COMMA, _WRAP_METHOD_SIMPLE_UNPACK, __VA_ARGS__))); \
    return nullptr;                                                     \
  }
#define _WRAP_METHOD_SIMPLE(name, glFunc, ...) _WRAP_METHOD_SIMPLE_INTERNAL(name, false, glFunc, __VA_ARGS__)
#define _WRAP_WEBGL2_METHOD_SIMPLE(name, glFunc, ...) _WRAP_METHOD_SIMPLE_INTERNAL(name, true, glFunc, __VA_ARGS__)

#define _WRAP_METHOD_SIMPLE_UNPACK(i, _) EXJSValueToNumberFast(jsCtx, jsArgv[i])


  // This listing follows the order in
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext


  // The WebGL context
  // -----------------

  _WRAP_METHOD(getContextAttributes, 0) {
    auto jsResult = JSObjectMake(jsCtx, nullptr, nullptr);
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "alpha",
                                          JSValueMakeBoolean(jsCtx, true));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "depth",
                                          JSValueMakeBoolean(jsCtx, true));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "stencil",
                                          JSValueMakeBoolean(jsCtx, false));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "antialias",
                                          JSValueMakeBoolean(jsCtx, false));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "premultipliedAlpha",
                                          JSValueMakeBoolean(jsCtx, false));
    return jsResult;
  }

  _WRAP_METHOD(isContextLost, 0) {
    return JSValueMakeBoolean(jsCtx, false);
  }


  // Viewing and clipping
  // --------------------

  _WRAP_METHOD_SIMPLE(scissor, glScissor, x, y, width, height)

  _WRAP_METHOD_SIMPLE(viewport, glViewport, x, y, width, height)


  // State information
  // -----------------

  _WRAP_METHOD_SIMPLE(activeTexture, glActiveTexture, texture)

  _WRAP_METHOD_SIMPLE(blendColor, glBlendColor, red, green, blue, alpha)

  _WRAP_METHOD_SIMPLE(blendEquation, glBlendEquation, mode)

  _WRAP_METHOD_SIMPLE(blendEquationSeparate, glBlendEquationSeparate, modeRGB, modeAlpha)

  _WRAP_METHOD_SIMPLE(blendFunc, glBlendFunc, sfactor, dfactor)

  _WRAP_METHOD_SIMPLE(blendFuncSeparate, glBlendFuncSeparate, srcRGB, dstRGB, srcAlpha, dstAlpha)

  _WRAP_METHOD_SIMPLE(clearColor, glClearColor, red, green, blue, alpha)

  _WRAP_METHOD_SIMPLE(clearDepth, glClearDepthf, depth)

  _WRAP_METHOD_SIMPLE(clearStencil, glClearStencil, s)

  _WRAP_METHOD_SIMPLE(colorMask, glColorMask, red, green, blue, alpha)

  _WRAP_METHOD_SIMPLE(cullFace, glCullFace, mode)

  _WRAP_METHOD_SIMPLE(depthFunc, glDepthFunc, func)

  _WRAP_METHOD_SIMPLE(depthMask, glDepthMask, flag)

  _WRAP_METHOD_SIMPLE(depthRange, glDepthRangef, zNear, zFar)

  _WRAP_METHOD_SIMPLE(disable, glDisable, cap)

  _WRAP_METHOD_SIMPLE(enable, glEnable, cap)

  _WRAP_METHOD_SIMPLE(frontFace, glFrontFace, mode)

  template<typename T, size_t dim, typename F>
  inline JSValueRef getParameterArray(JSContextRef jsCtx, JSTypedArrayType arrayType,
                                      F &&glGetFunc, GLenum pname) {
    T glResults[dim];
    addBlockingToNextBatch([&] { glGetFunc(pname, glResults); });
    return makeTypedArray(jsCtx, arrayType, glResults, sizeof(glResults));
  }

  _WRAP_METHOD(getParameter, 1) {
    EXJS_UNPACK_ARGV(GLenum pname);
    switch (pname) {
        // Float32Array[0]
      case GL_COMPRESSED_TEXTURE_FORMATS:
        return makeTypedArray(jsCtx, kJSTypedArrayTypeFloat32Array, nullptr, 0);

        // FLoat32Array[2]
      case GL_ALIASED_LINE_WIDTH_RANGE:
      case GL_ALIASED_POINT_SIZE_RANGE:
      case GL_DEPTH_RANGE:
        return getParameterArray<GLfloat, 2>(jsCtx, kJSTypedArrayTypeFloat32Array, &glGetFloatv, pname);
        // FLoat32Array[4]
      case GL_BLEND_COLOR:
      case GL_COLOR_CLEAR_VALUE:
        return getParameterArray<GLfloat, 4>(jsCtx, kJSTypedArrayTypeFloat32Array, &glGetFloatv, pname);

        // Int32Array[2]
      case GL_MAX_VIEWPORT_DIMS:
        return getParameterArray<GLint, 2>(jsCtx, kJSTypedArrayTypeInt32Array, &glGetIntegerv, pname);
        // Int32Array[4]
      case GL_SCISSOR_BOX:
      case GL_VIEWPORT:
        return getParameterArray<GLint, 4>(jsCtx, kJSTypedArrayTypeInt32Array, &glGetIntegerv, pname);

        // boolean[4]
      case GL_COLOR_WRITEMASK: {
        GLint glResults[4];
        addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults); });
        JSValueRef jsResults[4];
        for (unsigned int i = 0; i < 4; ++i) {
          jsResults[i] = JSValueMakeBoolean(jsCtx, glResults[i]);
        }
        return JSObjectMakeArray(jsCtx, 4, jsResults, nullptr);
      }

        // boolean
      case GL_UNPACK_FLIP_Y_WEBGL:
        return JSValueMakeBoolean(jsCtx, unpackFLipY);
      case GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL:
      case GL_UNPACK_COLORSPACE_CONVERSION_WEBGL:
        return JSValueMakeBoolean(jsCtx, false);
      case GL_RASTERIZER_DISCARD:
      case GL_SAMPLE_ALPHA_TO_COVERAGE:
      case GL_SAMPLE_COVERAGE:
      case GL_TRANSFORM_FEEDBACK_ACTIVE:
      case GL_TRANSFORM_FEEDBACK_PAUSED: {
        GLint glResult;
        addBlockingToNextBatch([&] { glGetIntegerv(pname, &glResult); });
        return JSValueMakeBoolean(jsCtx, glResult);
      }

        // string
      case GL_RENDERER:
      case GL_SHADING_LANGUAGE_VERSION:
      case GL_VENDOR:
      case GL_VERSION: {
        const GLubyte *glStr;
        addBlockingToNextBatch([&] { glStr = glGetString(pname); });
        return EXJSValueMakeStringFromUTF8CString(jsCtx, (const char *) glStr);
      }

        // float
      case GL_DEPTH_CLEAR_VALUE:
      case GL_LINE_WIDTH:
      case GL_POLYGON_OFFSET_FACTOR:
      case GL_POLYGON_OFFSET_UNITS:
      case GL_SAMPLE_COVERAGE_VALUE:
      case GL_MAX_TEXTURE_LOD_BIAS: {
        GLfloat glFloat;
        addBlockingToNextBatch([&] { glGetFloatv(pname, &glFloat); });
        return JSValueMakeNumber(jsCtx, glFloat);
      }

        // UEXGLObjectId
      case GL_ARRAY_BUFFER_BINDING:
      case GL_ELEMENT_ARRAY_BUFFER_BINDING:
      case GL_CURRENT_PROGRAM: {
        GLint glInt;
        addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
        for (const auto &pair : objects) {
          if (pair.second == glInt) {
            return JSValueMakeNumber(jsCtx, pair.first);
          }
        }
        return nullptr;
      }

        // Unimplemented...
#define _GET_PARAMETER_UNIMPL(param)                                         \
      case GL_##param:                                                       \
        throw std::runtime_error("EXGL: getParameter() doesn't support gl."  \
                                 #param " yet!");
        _GET_PARAMETER_UNIMPL(COPY_READ_BUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(COPY_WRITE_BUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(DRAW_FRAMEBUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(READ_FRAMEBUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(RENDERBUFFER)
        _GET_PARAMETER_UNIMPL(SAMPLER_BINDING)
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_2D_ARRAY)
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_2D)
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_3D)
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_CUBE_MAP)
        _GET_PARAMETER_UNIMPL(TRANSFORM_FEEDBACK_BINDING)
        _GET_PARAMETER_UNIMPL(TRANSFORM_FEEDBACK_BUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(UNIFORM_BUFFER_BINDING)
        _GET_PARAMETER_UNIMPL(VERTEX_ARRAY_BINDING)
#undef _GET_PARAMETER_UNIMPL

        // int
      default: {
        GLint glInt;
        addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
        return JSValueMakeNumber(jsCtx, glInt);
      }
    }
  }

  _WRAP_METHOD(getError, 0) {
    GLenum glResult;
    addBlockingToNextBatch([&] { glResult = glGetError(); });
    return JSValueMakeNumber(jsCtx, glResult);
  }

  _WRAP_METHOD_SIMPLE(hint, glHint, target, mode)

  _WRAP_METHOD(isEnabled, 1) {
    EXJS_UNPACK_ARGV(GLenum cap);
    GLboolean glResult;
    addBlockingToNextBatch([&] { glResult = glIsEnabled(cap); });
    return JSValueMakeBoolean(jsCtx, glResult);
  }

  _WRAP_METHOD_SIMPLE(lineWidth, glLineWidth, width)

  _WRAP_METHOD(pixelStorei, 2) {
    EXJS_UNPACK_ARGV(GLenum pname, GLint param);
    switch (pname) {
      case GL_UNPACK_FLIP_Y_WEBGL:
        unpackFLipY = param;
        break;
      default:
        EXGLSysLog("EXGL: gl.pixelStorei() doesn't support this parameter yet!");
        break;
    }
    return nullptr;
  }

  _WRAP_METHOD_SIMPLE(polygonOffset, glPolygonOffset, factor, units)

  _WRAP_METHOD_SIMPLE(sampleCoverage, glSampleCoverage, value, invert)

  _WRAP_METHOD_SIMPLE(stencilFunc, glStencilFunc, func, ref, mask)

  _WRAP_METHOD_SIMPLE(stencilFuncSeparate, glStencilFuncSeparate, face, func, ref, mask)

  _WRAP_METHOD_SIMPLE(stencilMask, glStencilMask, mask)

  _WRAP_METHOD_SIMPLE(stencilMaskSeparate, glStencilMaskSeparate, face, mask)

  _WRAP_METHOD_SIMPLE(stencilOp, glStencilOp, fail, zfail, zpass)

  _WRAP_METHOD_SIMPLE(stencilOpSeparate, glStencilOpSeparate, face, fail, zfail, zpass)


  // Buffers
  // -------

  _WRAP_METHOD(bindBuffer, 2) {
    EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId fBuffer);
    addToNextBatch([=] { glBindBuffer(target, lookupObject(fBuffer)); });
    return nullptr;
  }

  _WRAP_METHOD(bufferData, 3) {
    GLenum target = EXJSValueToNumberFast(jsCtx, jsArgv[0]);
    auto jsSecond = jsArgv[1];
    GLenum usage = EXJSValueToNumberFast(jsCtx, jsArgv[2]);

    if (JSValueIsNumber(jsCtx, jsSecond)) {
      GLsizeiptr length = EXJSValueToNumberFast(jsCtx, jsSecond);
      addToNextBatch([=] { glBufferData(target, length, nullptr, usage); });
    } else if (JSValueIsNull(jsCtx, jsSecond)) {
      addToNextBatch([=] { glBufferData(target, 0, nullptr, usage); });
    } else {
      size_t length;
      auto data = jsValueToSharedArray(jsCtx, jsSecond, &length);
      addToNextBatch([=] { glBufferData(target, length, data.get(), usage); });
    }
    return nullptr;
  }

  _WRAP_METHOD(bufferSubData, 3) {
    if (!JSValueIsNull(jsCtx, jsArgv[2])) {
      EXJS_UNPACK_ARGV(GLenum target, GLintptr offset);
      size_t length;
      auto data = jsValueToSharedArray(jsCtx, jsArgv[2], &length);
      addToNextBatch([=] { glBufferSubData(target, offset, length, data.get()); });
    }
    return nullptr;
  }

  _WRAP_METHOD(createBuffer, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint buffer;
      glGenBuffers(1, &buffer);
      return buffer;
    });
  }

  _WRAP_METHOD(deleteBuffer, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fBuffer);
    addToNextBatch([=] {
      GLuint buffer = lookupObject(fBuffer);
      glDeleteBuffers(1, &buffer);
    });
    return nullptr;
  }

  _WRAP_METHOD(getBufferParameter, 2) {
    EXJS_UNPACK_ARGV(GLenum target, GLenum pname);
    GLint glResult;
    addBlockingToNextBatch([&] { glGetBufferParameteriv(target, pname, &glResult); });
    return JSValueMakeNumber(jsCtx, glResult);
  }

#define _WRAP_METHOD_IS_OBJECT_INTERNAL(type, requiresWebGL2) \
  _WRAP_METHOD_INTERNAL(is ## type, 1, requiresWebGL2) { \
    EXJS_UNPACK_ARGV(UEXGLObjectId f);            \
    GLboolean glResult;                           \
    addBlockingToNextBatch([&] {                  \
      glResult = glIs ## type(lookupObject(f));   \
    });                                           \
    return JSValueMakeBoolean(jsCtx, glResult);   \
  }

#define _WRAP_METHOD_IS_OBJECT(type)        _WRAP_METHOD_IS_OBJECT_INTERNAL(type, false)
#define _WRAP_WEBGL2_METHOD_IS_OBJECT(type) _WRAP_METHOD_IS_OBJECT_INTERNAL(type, true)

  _WRAP_METHOD_IS_OBJECT(Buffer)


  // Buffers (WebGL2)

  _WRAP_WEBGL2_METHOD_SIMPLE(copyBufferSubData, glCopyBufferSubData,
                      readTarget, writeTarget, readOffset, writeOffset, size)

  // glGetBufferSubData is not available in OpenGL ES
  _WRAP_METHOD_UNIMPL(getBufferSubData)


  // Framebuffers
  // ------------

  _WRAP_METHOD(bindFramebuffer, 2) {
    EXJS_UNPACK_ARGV(GLenum target);
    if (JSValueIsNull(jsCtx, jsArgv[1])) {
      addToNextBatch([=] { glBindFramebuffer(target, defaultFramebuffer); });
    } else {
      UEXGLObjectId fFramebuffer = EXJSValueToNumberFast(jsCtx, jsArgv[1]);
      addToNextBatch([=] { glBindFramebuffer(target, lookupObject(fFramebuffer)); });
    }
    return nullptr;
  }

  _WRAP_METHOD(checkFramebufferStatus, 1) {
    GLenum glResult;
    EXJS_UNPACK_ARGV(GLenum target);
    addBlockingToNextBatch([&] { glResult = glCheckFramebufferStatus(target); });
    return JSValueMakeNumber(jsCtx, glResult);
  }

  _WRAP_METHOD(createFramebuffer, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint framebuffer;
      glGenFramebuffers(1, &framebuffer);
      return framebuffer;
    });
  }

  _WRAP_METHOD(deleteFramebuffer, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fFramebuffer);
    addToNextBatch([=] {
      GLuint framebuffer = lookupObject(fFramebuffer);
      glDeleteFramebuffers(1, &framebuffer);
    });
    return nullptr;
  }

  _WRAP_METHOD(framebufferRenderbuffer, 4) {
    EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, GLenum renderbuffertarget, UEXGLObjectId fRenderbuffer);
    addToNextBatch([=] {
      GLuint renderbuffer = lookupObject(fRenderbuffer);
      glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
    });
    return nullptr;
  }

  _WRAP_METHOD(framebufferTexture2D, 5) {
    EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, GLenum textarget, UEXGLObjectId fTexture, GLint level);
    addToNextBatch([=] {
      glFramebufferTexture2D(target, attachment, textarget, lookupObject(fTexture), level);
    });
    return nullptr;
  }

  _WRAP_METHOD_UNIMPL(getFramebufferAttachmentParameter)

  _WRAP_METHOD_IS_OBJECT(Framebuffer)

  _WRAP_METHOD(readPixels, 7) {
    EXJS_UNPACK_ARGV(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type);
    if (usingTypedArrayHack) {
      size_t byteLength = width * height * bytesPerPixel(type, format);
      auto pixels = std::shared_ptr<void>(malloc(byteLength), free);
      addBlockingToNextBatch([&] {
        glReadPixels(x, y, width, height, format, type, pixels.get());
      });
      JSObjectSetTypedArrayData(jsCtx, (JSObjectRef) jsArgv[6], pixels.get(), byteLength);
    } else {
      void *pixels = JSObjectGetTypedArrayBytesPtr(jsCtx, (JSObjectRef) jsArgv[6], nullptr);
      addBlockingToNextBatch([&] {
        glReadPixels(x, y, width, height, format, type, pixels);
      });
    }
    return nullptr;
  }
  
  
  // Framebuffers (WebGL2)
  // ---------------------
  
  _WRAP_METHOD_SIMPLE(blitFramebuffer, glBlitFramebuffer,
                      srcX0, srcY0, srcX1, srcY1,
                      dstX0, dstY0, dstX1, dstY1,
                      mask, filter)
  
  _WRAP_WEBGL2_METHOD(framebufferTextureLayer, 5) {
    EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, UEXGLObjectId texture, GLint level, GLint layer);
    addToNextBatch([=] {
      glFramebufferTextureLayer(target, attachment, lookupObject(texture), level, layer);
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD(invalidateFramebuffer, 2) {
    EXJS_UNPACK_ARGV(GLenum target);
    size_t length;
    auto attachments = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
    addToNextBatch([=] {
      glInvalidateFramebuffer(target, (GLsizei) length, (GLenum *) attachments.get());
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD(invalidateSubFramebuffer, 6) {
    EXJS_UNPACK_ARGV(GLenum target);
    EXJS_UNPACK_ARGV_OFFSET(2, GLint x, GLint y, GLint width, GLint height);
    size_t length;
    auto attachments = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
    addToNextBatch([=] {
      glInvalidateSubFramebuffer(target, (GLsizei) length, (GLenum *) attachments.get(), x, y, width, height);
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD_SIMPLE(readBuffer, glReadBuffer, mode)
  
  
  // Renderbuffers
  // -------------

  _WRAP_METHOD(bindRenderbuffer, 2) {
    EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId fRenderbuffer);
    addToNextBatch([=] {
      GLuint renderbuffer = lookupObject(fRenderbuffer);
      glBindRenderbuffer(target, renderbuffer);
    });
    return nullptr;
  }

  _WRAP_METHOD(createRenderbuffer, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint renderbuffer;
      glGenRenderbuffers(1, &renderbuffer);
      return renderbuffer;
    });
  }

  _WRAP_METHOD(deleteRenderbuffer, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fRenderbuffer);
    addToNextBatch([=] {
      GLuint renderbuffer = lookupObject(fRenderbuffer);
      glDeleteRenderbuffers(1, &renderbuffer);
    });
    return nullptr;
  }

  _WRAP_METHOD_UNIMPL(getRenderbufferParameter)

  _WRAP_METHOD_IS_OBJECT(Renderbuffer)

  _WRAP_METHOD(renderbufferStorage, 4) {
    EXJS_UNPACK_ARGV(GLenum target, GLint internalformat, GLsizei width, GLsizei height);
    addToNextBatch([=] {
      glRenderbufferStorage(target, internalformat, width, height);
    });
    return nullptr;
  }


  // Renderbuffers (WebGL2)
  // ----------------------

  _WRAP_METHOD_UNIMPL(getInternalformatParameter)
  
  _WRAP_METHOD_UNIMPL(renderbufferStorageMultisample)


  // Textures
  // --------

  _WRAP_METHOD(bindTexture, 2) {
    EXJS_UNPACK_ARGV(GLenum target);
    if (JSValueIsNull(jsCtx, jsArgv[1])) {
      addToNextBatch(std::bind(glBindTexture, target, 0));
    } else {
      UEXGLObjectId fTexture = EXJSValueToNumberFast(jsCtx, jsArgv[1]);
      addToNextBatch([=] { glBindTexture(target, lookupObject(fTexture)); });
    }
    return nullptr;
  }

  _WRAP_METHOD_UNIMPL(compressedTexImage2D)

  _WRAP_METHOD_UNIMPL(compressedTexSubImage2D)

  _WRAP_METHOD_SIMPLE(copyTexImage2D, glCopyTexImage2D,
                      target, level, internalformat,
                      x, y, width, height, border)

  _WRAP_METHOD_SIMPLE(copyTexSubImage2D, glCopyTexSubImage2D,
                      target, level,
                      xoffset, yoffset, x, y, width, height)

  _WRAP_METHOD(createTexture, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint texture;
      glGenTextures(1, &texture);
      return texture;
    });
  }

  _WRAP_METHOD(deleteTexture, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fTexture);
    addToNextBatch([=] {
      GLuint texture = lookupObject(fTexture);
      glDeleteTextures(1, &texture);
    });
    return nullptr;
  }

  _WRAP_METHOD_SIMPLE(generateMipmap, glGenerateMipmap, target)

  _WRAP_METHOD_UNIMPL(getTexParameter)

  _WRAP_METHOD_IS_OBJECT(Texture)

  inline void decodeURI(char *dst, const char *src) {
    char a, b;
    while (*src) {
      if ((*src == '%') &&
          ((a = src[1]) && (b = src[2])) &&
          (isxdigit(a) && isxdigit(b))) {
        if (a >= 'a') {
          a -= 'a' - 'A';
        }
        if (a >= 'A') {
          a -= ('A' - 10);
        } else {
          a -= '0';
        }
        if (b >= 'a') {
          b -= 'a' - 'A';
        }
        if (b >= 'A') {
          b -= ('A' - 10);
        } else {
          b -= '0';
        }
        *dst++ = 16 * a + b;
        src += 3;
      } else if (*src == '+') {
        *dst++ = ' ';
        src++;
      } else {
        *dst++ = *src++;
      }
    }
    *dst++ = '\0';
  }

  // Load image data from an object with a `.localUri` member
  std::shared_ptr<void> loadImage(JSContextRef jsCtx, JSObjectRef jsPixels,
                                  int *fileWidth, int *fileHeight, int *fileComp) {
    JSValueRef jsLocalUri = EXJSObjectGetPropertyNamed(jsCtx, jsPixels, "localUri");
    if (jsLocalUri && JSValueIsString(jsCtx, jsLocalUri)) {
      // TODO(nikki): Check that this file is in the right scope
      auto localUri = jsValueToSharedStr(jsCtx, jsLocalUri);
      if (strncmp(localUri.get(), "file://", 7) != 0) {
        return std::shared_ptr<void>(nullptr);
      }
      char localPath[strlen(localUri.get())];
      decodeURI(localPath, localUri.get() + 7);
      return std::shared_ptr<void>(stbi_load(localPath,
                                             fileWidth, fileHeight, fileComp,
                                             STBI_rgb_alpha),
                                   stbi_image_free);
    }
    return std::shared_ptr<void>(nullptr);
  }

  _WRAP_METHOD(texImage2D, 6) {
    GLenum target;
    GLint level, internalformat;
    GLsizei width = 0, height = 0, border = 0;
    GLenum format, type;
    JSObjectRef jsPixels;

    if (jsArgc == 9) {
      // 9-argument version
      EXJS_UNPACK_ARGV(target, level, internalformat, width, height, border, format, type);
      jsPixels = (JSObjectRef) jsArgv[8];
    } else if  (jsArgc == 6) {
      // 6-argument version
      EXJS_UNPACK_ARGV(target, level, internalformat, format, type);
      jsPixels = (JSObjectRef) jsArgv[5];
    } else {
      throw std::runtime_error("EXGL: Invalid number of arguments to gl.texImage2D()!");
    }

    // Null?
    if (JSValueIsNull(jsCtx, jsPixels)) {
      addToNextBatch([=] {
        glTexImage2D(target, level, internalformat, width, height, border, format, type, nullptr);
      });
      return nullptr;
    }

    std::shared_ptr<void> data(nullptr);

    // Try TypedArray
    if (jsArgc == 9) {
      data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
    }

    // Try object with `.localUri` member
    if (!data) {
      data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
    }

    if (data) {
      if (unpackFLipY) {
        flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=] {
        glTexImage2D(target, level, internalformat, width, height, border, format, type, data.get());
      });
      return nullptr;
    }

    // Nothing worked...
    throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texImage2D()!");
  }

  _WRAP_METHOD(texSubImage2D, 7) {
    GLenum target;
    GLint level, xoffset, yoffset;
    GLsizei width = 0, height = 0;
    GLenum format, type;
    JSObjectRef jsPixels;

    if (jsArgc == 9) {
      // 9-argument version
      EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, width, height, format, type);
      jsPixels = (JSObjectRef) jsArgv[8];
    } else if  (jsArgc == 7) {
      // 7-argument version
      EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, format, type);
      jsPixels = (JSObjectRef) jsArgv[6];
    } else {
      throw std::runtime_error("EXGL: Invalid number of arguments to gl.texSubImage2D()!");
    }

    // Null?
    if (JSValueIsNull(jsCtx, jsPixels)) {
      addToNextBatch([=] {
        void *nulled = calloc(width * height, bytesPerPixel(type, format));
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, nulled);
        free(nulled);
      });
      return nullptr;
    }

    std::shared_ptr<void> data(nullptr);

    // Try TypedArray
    if (jsArgc == 9) {
      data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
    }

    // Try object with `.localUri` member
    if (!data) {
      data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
    }

    if (data) {
      if (unpackFLipY) {
        flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=] {
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, data.get());
      });
      return nullptr;
    }

    // Nothing worked...
    throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texSubImage2D()!");
  }

  _WRAP_METHOD_SIMPLE(texParameterf, glTexParameterf, target, pname, param)

  _WRAP_METHOD_SIMPLE(texParameteri, glTexParameteri, target, pname, param)


  // Textures (WebGL2)
  // -----------------

  _WRAP_METHOD_SIMPLE(texStorage2D, glTexStorage2D, target, levels, internalformat, width, height)

  _WRAP_METHOD_SIMPLE(texStorage3D, glTexStorage3D, target, levels, internalformat, width, height, depth)

  _WRAP_WEBGL2_METHOD(texImage3D, 10) {
    GLenum target;
    GLint level, internalformat;
    GLsizei width, height, depth, border;
    GLenum format, type;
    JSObjectRef jsPixels;
    
    EXJS_UNPACK_ARGV(target, level, internalformat, width, height, depth, border, format, type);
    jsPixels = (JSObjectRef) jsArgv[9];
    
    // Null?
    if (JSValueIsNull(jsCtx, jsPixels)) {
      addToNextBatch([=] {
        glTexImage3D(target, level, internalformat, width, height, depth, border, format, type, nullptr);
      });
      return nullptr;
    }
    
    std::shared_ptr<void> data(nullptr);
    
    // Try TypedArray
    data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
    
    // Try object with `.localUri` member
    if (!data) {
      data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
    }
    
    if (data) {
      if (unpackFLipY) {
        GLubyte *texels = (GLubyte *) data.get();
        GLubyte *texelLayer = texels;
        for (int z = 0; z < depth; z++) {
          flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
          texelLayer += bytesPerPixel(type, format) * width * height;
        }
      }
      addToNextBatch([=] {
        glTexImage3D(target, level, internalformat, width, height, depth, border, format, type, data.get());
      });
      return nullptr;
    }
    
    // Nothing worked...
    throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texImage3D()!");
  }
  
  _WRAP_WEBGL2_METHOD(texSubImage3D, 11) {
    GLenum target;
    GLint level, xoffset, yoffset, zoffset;
    GLsizei width, height, depth;
    GLenum format, type;
    JSObjectRef jsPixels;
    
    EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type);
    jsPixels = (JSObjectRef) jsArgv[10];
    
    // Null?
    if (JSValueIsNull(jsCtx, jsPixels)) {
      addToNextBatch([=] {
        void *nulled = calloc(width * height, bytesPerPixel(type, format));
        glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, nulled);
        free(nulled);
      });
      return nullptr;
    }
    
    std::shared_ptr<void> data(nullptr);
    
    // Try TypedArray
    data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
    
    // Try object with `.localUri` member
    if (!data) {
      data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
    }
    
    if (data) {
      if (unpackFLipY) {
        GLubyte *texels = (GLubyte *) data.get();
        GLubyte *texelLayer = texels;
        for (int z = 0; z < depth; z++) {
          flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
          texelLayer += bytesPerPixel(type, format) * width * height;
        }
      }
      addToNextBatch([=] {
        glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, data.get());
      });
      return nullptr;
    }
    
    // Nothing worked...
    throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texSubImage3D()!");
  }

  _WRAP_WEBGL2_METHOD_SIMPLE(copyTexSubImage3D, glCopyTexSubImage3D,
    target, level, xoffset, yoffset, zoffset, x, y, width, height)

  _WRAP_METHOD_UNIMPL(compressedTexImage3D)

  _WRAP_METHOD_UNIMPL(compressedTexSubImage3D)


  // Programs and shaders
  // --------------------

  _WRAP_METHOD(attachShader, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, UEXGLObjectId fShader);
    addToNextBatch([=] { glAttachShader(lookupObject(fProgram), lookupObject(fShader)); });
    return nullptr;
  }

  _WRAP_METHOD(bindAttribLocation, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLuint index);
    auto name = jsValueToSharedStr(jsCtx, jsArgv[2]);
    addToNextBatch([=] { glBindAttribLocation(lookupObject(fProgram), index, name.get()); });
    return nullptr;
  }

  _WRAP_METHOD(compileShader, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
    addToNextBatch([=] { glCompileShader(lookupObject(fShader)); });
    return nullptr;
  }

  _WRAP_METHOD(createProgram, 0) {
    return addFutureToNextBatch(jsCtx, &glCreateProgram);
  }

  _WRAP_METHOD(createShader, 1) {
    EXJS_UNPACK_ARGV(GLenum type);
    if (type == GL_VERTEX_SHADER || type == GL_FRAGMENT_SHADER) {
      return addFutureToNextBatch(jsCtx, std::bind(glCreateShader, type));
    } else {
      return JSValueMakeNull(jsCtx);
    }
  }

  _WRAP_METHOD(deleteProgram, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    addToNextBatch([=] { glDeleteProgram(lookupObject(fProgram)); });
    return nullptr;
  }

  _WRAP_METHOD(deleteShader, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
    addToNextBatch([=] { glDeleteShader(lookupObject(fShader)); });
    return nullptr;
  }

  _WRAP_METHOD(detachShader, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, UEXGLObjectId fShader);
    addToNextBatch([=] { glDetachShader(lookupObject(fProgram), lookupObject(fShader)); });
    return nullptr;
  }

  _WRAP_METHOD(getAttachedShaders, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);

    GLint count;
    std::vector<GLuint> glResults;
    addBlockingToNextBatch([&] {
      GLuint program = lookupObject(fProgram);
      glGetProgramiv(program, GL_ATTACHED_SHADERS, &count);
      glResults.resize(count);
      glGetAttachedShaders(program, count, nullptr, glResults.data());
    });

    JSValueRef jsResults[count];
    for (auto i = 0; i < count; ++i) {
      UEXGLObjectId exglObjId = 0;
      for (const auto &pair : objects) {
        if (pair.second == glResults[i]) {
          exglObjId = pair.first;
        }
      }
      if (exglObjId == 0) {
        throw new std::runtime_error("EXGL: Internal error: couldn't find UEXGLObjectId "
                                     "associated with shader in getAttachedShaders()!");
      }
      jsResults[i] = JSValueMakeNumber(jsCtx, exglObjId);
    }
    return JSObjectMakeArray(jsCtx, count, jsResults, nullptr);
  }

  _WRAP_METHOD(getProgramParameter, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLenum pname);
    GLint glResult;
    addBlockingToNextBatch([&] { glGetProgramiv(lookupObject(fProgram), pname, &glResult); });
    if (pname == GL_DELETE_STATUS || pname == GL_LINK_STATUS || pname == GL_VALIDATE_STATUS) {
      return JSValueMakeBoolean(jsCtx, glResult);
    } else {
      return JSValueMakeNumber(jsCtx, glResult);
    }
  }

  _WRAP_METHOD(getShaderParameter, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fShader, GLenum pname);
    GLint glResult;
    addBlockingToNextBatch([&] { glGetShaderiv(lookupObject(fShader), pname, &glResult); });
    if (pname == GL_DELETE_STATUS || pname == GL_COMPILE_STATUS) {
      return JSValueMakeBoolean(jsCtx, glResult);
    } else {
      return JSValueMakeNumber(jsCtx, glResult);
    }
  }

  _WRAP_METHOD(getShaderPrecisionFormat, 2) {
    EXJS_UNPACK_ARGV(GLenum shaderType, GLenum precisionType);

    GLint range[2], precision;
    addBlockingToNextBatch([&] {
      glGetShaderPrecisionFormat(shaderType, precisionType, range, &precision);
    });

    JSObjectRef jsResult = JSObjectMake(jsCtx, nullptr, nullptr);
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "rangeMin",
                                          JSValueMakeNumber(jsCtx, range[0]));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "rangeMax",
                                          JSValueMakeNumber(jsCtx, range[1]));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "precision",
                                          JSValueMakeNumber(jsCtx, precision));
    return jsResult;
  }

  template<typename F, typename G>
  inline JSValueRef getShaderOrProgramStr(JSContextRef jsCtx, const JSValueRef jsArgv[],
                                          F &&glGetLengthParam, GLenum glLengthParam, G &&glGetStr) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fObj);
    GLint length;
    std::string str;
    addBlockingToNextBatch([&] {
      GLuint obj = lookupObject(fObj);
      glGetLengthParam(obj, glLengthParam, &length);
      str.resize(length);
      glGetStr(obj, length, nullptr, &str[0]);
    });
    return EXJSValueMakeStringFromUTF8CString(jsCtx, str.c_str());
  }

  _WRAP_METHOD(getProgramInfoLog, 1) {
    return getShaderOrProgramStr(jsCtx, jsArgv,
                                 glGetProgramiv, GL_INFO_LOG_LENGTH,
                                 glGetProgramInfoLog);
  }

  _WRAP_METHOD(getShaderInfoLog, 1) {
    return getShaderOrProgramStr(jsCtx, jsArgv,
                                 glGetShaderiv, GL_INFO_LOG_LENGTH,
                                 glGetShaderInfoLog);
  }

  _WRAP_METHOD(getShaderSource, 1) {
    return getShaderOrProgramStr(jsCtx, jsArgv,
                                 glGetShaderiv, GL_SHADER_SOURCE_LENGTH,
                                 glGetShaderSource);
  }

  _WRAP_METHOD_IS_OBJECT(Program)

  _WRAP_METHOD_IS_OBJECT(Shader)

  _WRAP_METHOD(linkProgram, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    addToNextBatch([=] { glLinkProgram(lookupObject(fProgram)); });
    return nullptr;
  }

  _WRAP_METHOD(shaderSource, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
    auto str = jsValueToSharedStr(jsCtx, jsArgv[1]);
    addToNextBatch([=] {
      char *pstr = str.get();
      glShaderSource(lookupObject(fShader), 1, (const char **) &pstr, nullptr);
    });
    return nullptr;
  }

  _WRAP_METHOD(useProgram, 1) {
    if (JSValueIsNull(jsCtx, jsArgv[0])) {
      addToNextBatch(std::bind(glUseProgram, 0));
    } else {
      EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
      addToNextBatch([=] { glUseProgram(lookupObject(fProgram)); });
    }
    return nullptr;
  }

  _WRAP_METHOD(validateProgram, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    addToNextBatch([=] { glValidateProgram(lookupObject(fProgram)); });
    return nullptr;
  }


  // Programs and shaders (WebGL2)

  _WRAP_METHOD(getFragDataLocation, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program);
    auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
    GLint location;
    addBlockingToNextBatch([&] {
      location = glGetFragDataLocation(lookupObject(program), name.get());
    });
    return location == -1 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, location);
  }


  // Uniforms and attributes
  // -----------------------

  _WRAP_METHOD_SIMPLE(disableVertexAttribArray, glDisableVertexAttribArray, index)

  _WRAP_METHOD_SIMPLE(enableVertexAttribArray, glEnableVertexAttribArray, index)

  template<typename F>
  inline JSValueRef getActiveInfo(JSContextRef jsCtx, const JSValueRef jsArgv[],
                                  GLenum lengthParam, F &&glFunc) {
    if (JSValueIsNull(jsCtx, jsArgv[0])) {
      return JSValueMakeNull(jsCtx);
    }

    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLuint index);

    GLsizei length;
    GLint size;
    GLenum type;
    std::string name;
    GLint maxNameLength;
    addBlockingToNextBatch([&] {
      GLuint program = lookupObject(fProgram);
      glGetProgramiv(program, lengthParam, &maxNameLength);
      name.resize(maxNameLength);
      glFunc(program, index, maxNameLength, &length, &size, &type, &name[0]);
    });

    if (strlen(name.c_str()) == 0) { // name.length() may be larger
      return JSValueMakeNull(jsCtx);
    }

    JSObjectRef jsResult = JSObjectMake(jsCtx, nullptr, nullptr);
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "name",
                                          EXJSValueMakeStringFromUTF8CString(jsCtx, name.c_str()));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "size", JSValueMakeNumber(jsCtx, size));
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "type", JSValueMakeNumber(jsCtx, type));
    return jsResult;
  }

  _WRAP_METHOD(getActiveAttrib, 2) {
    return getActiveInfo(jsCtx, jsArgv, GL_ACTIVE_ATTRIBUTE_MAX_LENGTH, glGetActiveAttrib);
  }

  _WRAP_METHOD(getActiveUniform, 2) {
    return getActiveInfo(jsCtx, jsArgv, GL_ACTIVE_UNIFORM_MAX_LENGTH, glGetActiveUniform);
  }

  _WRAP_METHOD(getAttribLocation, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
    GLint location;
    addBlockingToNextBatch([&] {
      location = glGetAttribLocation(lookupObject(fProgram), name.get());
    });
    return JSValueMakeNumber(jsCtx, location);
  }

  _WRAP_METHOD_UNIMPL(getUniform)

  _WRAP_METHOD(getUniformLocation, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
    GLint location;
    addBlockingToNextBatch([&] {
      location = glGetUniformLocation(lookupObject(fProgram), name.get());
    });
    return location == -1 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, location);
  }

  _WRAP_METHOD_UNIMPL(getVertexAttrib)

  _WRAP_METHOD_UNIMPL(getVertexAttribOffset)

  _WRAP_METHOD_SIMPLE(uniform1f, glUniform1f, uniform, x)
  _WRAP_METHOD_SIMPLE(uniform2f, glUniform2f, uniform, x, y)
  _WRAP_METHOD_SIMPLE(uniform3f, glUniform3f, uniform, x, y, z)
  _WRAP_METHOD_SIMPLE(uniform4f, glUniform4f, uniform, x, y, z, w)
  _WRAP_METHOD_SIMPLE(uniform1i, glUniform1i, uniform, x)
  _WRAP_METHOD_SIMPLE(uniform2i, glUniform2i, uniform, x, y)
  _WRAP_METHOD_SIMPLE(uniform3i, glUniform3i, uniform, x, y, z)
  _WRAP_METHOD_SIMPLE(uniform4i, glUniform4i, uniform, x, y, z, w)

#define _WRAP_METHOD_UNIFORM_V(suffix, dim, Type)                     \
  _WRAP_METHOD(uniform##suffix, 2) {                                  \
    GLuint uniform = EXJSValueToNumberFast(jsCtx, jsArgv[0]);         \
    size_t bytes;                                                     \
    auto data = jsValueToSharedArray(jsCtx, jsArgv[1], &bytes);       \
    GLsizei count = (GLsizei) bytes / sizeof(Type);                   \
    addToNextBatch([=] {                                              \
      glUniform##suffix(uniform, count / dim, (Type *) data.get());   \
    });                                                               \
    return nullptr;                                                   \
  }
  _WRAP_METHOD_UNIFORM_V(1fv, 1, GLfloat)
  _WRAP_METHOD_UNIFORM_V(2fv, 2, GLfloat)
  _WRAP_METHOD_UNIFORM_V(3fv, 3, GLfloat)
  _WRAP_METHOD_UNIFORM_V(4fv, 4, GLfloat)
  _WRAP_METHOD_UNIFORM_V(1iv, 1, GLint)
  _WRAP_METHOD_UNIFORM_V(2iv, 2, GLint)
  _WRAP_METHOD_UNIFORM_V(3iv, 3, GLint)
  _WRAP_METHOD_UNIFORM_V(4iv, 4, GLint)

#define _WRAP_METHOD_UNIFORM_MATRIX(suffix, dim)                        \
  _WRAP_METHOD(uniformMatrix##suffix, 3) {                              \
    GLuint uniform = EXJSValueToNumberFast(jsCtx, jsArgv[0]);           \
    GLboolean transpose = JSValueToBoolean(jsCtx, jsArgv[1]);           \
    size_t bytes;                                                       \
    auto data = jsValueToSharedArray(jsCtx, jsArgv[2], &bytes);         \
    GLsizei count = (GLsizei) bytes / sizeof(GLfloat);                  \
    addToNextBatch([=] {                                                \
      glUniformMatrix##suffix(uniform, count / dim, transpose, (GLfloat *) data.get()); \
    });                                                                 \
    return nullptr;                                                     \
  }
  _WRAP_METHOD_UNIFORM_MATRIX(2fv, 4)
  _WRAP_METHOD_UNIFORM_MATRIX(3fv, 9)
  _WRAP_METHOD_UNIFORM_MATRIX(4fv, 16)

#define _WRAP_METHOD_VERTEX_ATTRIB_V(suffix, Type)                      \
  _WRAP_METHOD(vertexAttrib##suffix, 2) {                               \
    GLuint index = EXJSValueToNumberFast(jsCtx, jsArgv[0]);             \
    auto data = jsValueToSharedArray(jsCtx, jsArgv[1], nullptr);        \
    addToNextBatch([=] { glVertexAttrib##suffix(index, (Type *) data.get());}); \
    return nullptr;                                                     \
  }
  _WRAP_METHOD_VERTEX_ATTRIB_V(1fv, GLfloat)
  _WRAP_METHOD_VERTEX_ATTRIB_V(2fv, GLfloat)
  _WRAP_METHOD_VERTEX_ATTRIB_V(3fv, GLfloat)
  _WRAP_METHOD_VERTEX_ATTRIB_V(4fv, GLfloat)

  _WRAP_METHOD_SIMPLE(vertexAttrib1f, glVertexAttrib1f, index, x)
  _WRAP_METHOD_SIMPLE(vertexAttrib2f, glVertexAttrib2f, index, x, y)
  _WRAP_METHOD_SIMPLE(vertexAttrib3f, glVertexAttrib3f, index, x, y, z)
  _WRAP_METHOD_SIMPLE(vertexAttrib4f, glVertexAttrib4f, index, x, y, z, w)

  _WRAP_METHOD(vertexAttribPointer, 6) {
    EXJS_UNPACK_ARGV(GLuint index, GLuint itemSize, GLenum type,
                     GLboolean normalized, GLsizei stride, GLint offset);
    addToNextBatch(std::bind(glVertexAttribPointer, index, itemSize, type,
                             normalized, stride, bufferOffset(offset)));
    return nullptr;
  }


  // Uniforms and attributes (WebGL2)
  // --------------------------------

  _WRAP_METHOD_SIMPLE(uniform1ui, glUniform1ui, location, x)
  _WRAP_METHOD_SIMPLE(uniform2ui, glUniform2ui, location, x, y)
  _WRAP_METHOD_SIMPLE(uniform3ui, glUniform3ui, location, x, y, z)
  _WRAP_METHOD_SIMPLE(uniform4ui, glUniform4ui, location, x, y, z, w)

  _WRAP_METHOD_UNIFORM_V(1uiv, 1, GLuint)
  _WRAP_METHOD_UNIFORM_V(2uiv, 2, GLuint)
  _WRAP_METHOD_UNIFORM_V(3uiv, 3, GLuint)
  _WRAP_METHOD_UNIFORM_V(4uiv, 4, GLuint)

  _WRAP_METHOD_UNIFORM_MATRIX(3x2fv, 6)
  _WRAP_METHOD_UNIFORM_MATRIX(4x2fv, 8)
  _WRAP_METHOD_UNIFORM_MATRIX(2x3fv, 6)
  _WRAP_METHOD_UNIFORM_MATRIX(4x3fv, 12)
  _WRAP_METHOD_UNIFORM_MATRIX(2x4fv, 8)
  _WRAP_METHOD_UNIFORM_MATRIX(3x4fv, 12)

  _WRAP_METHOD_SIMPLE(vertexAttribI4i, glVertexAttribI4i, index, x, y, z, w)
  _WRAP_METHOD_SIMPLE(vertexAttribI4ui, glVertexAttribI4ui, index, x, y, z, w)

  _WRAP_METHOD_VERTEX_ATTRIB_V(I4iv, GLint)
  _WRAP_METHOD_VERTEX_ATTRIB_V(I4uiv, GLuint)

  _WRAP_METHOD(vertexAttribIPointer, 5) {
    EXJS_UNPACK_ARGV(GLuint index, GLuint size, GLenum type, GLsizei stride, GLint offset);
    addToNextBatch(std::bind(glVertexAttribIPointer, index, size, type, stride, bufferOffset(offset)));
    return nullptr;
  }

#undef _WRAP_METHOD_UNIFORM_V
#undef _WRAP_METHOD_UNIFORM_MATRIX
#undef _WRAP_METHOD_VERTEX_ATTRIB_V


  // Drawing buffers
  // ---------------

  _WRAP_METHOD_SIMPLE(clear, glClear, mask)

  _WRAP_METHOD_SIMPLE(drawArrays, glDrawArrays, mode, first, count)

  _WRAP_METHOD(drawElements, 4) {
    EXJS_UNPACK_ARGV(GLenum mode, GLsizei count, GLenum type, GLint offset);
    addToNextBatch(std::bind(glDrawElements, mode, count, type, bufferOffset(offset)));
    return nullptr;
  }

  _WRAP_METHOD(finish, 0) {
    addToNextBatch(glFinish);
    return nullptr;
  }

  _WRAP_METHOD(flush, 0) {
    addToNextBatch(glFlush);
    return nullptr;
  }
  
  
  // Drawing buffers (WebGL2)
  // ------------------------
  
  _WRAP_WEBGL2_METHOD_SIMPLE(vertexAttribDivisor, glVertexAttribDivisor, index, divisor)
  
  _WRAP_WEBGL2_METHOD_SIMPLE(drawArraysInstanced, glDrawArraysInstanced, mode, first, count, instancecount)
  
  _WRAP_WEBGL2_METHOD(drawElementsInstanced, 5) {
    EXJS_UNPACK_ARGV(GLenum mode, GLsizei count, GLenum type, GLint offset, GLsizei instanceCount);
    addToNextBatch([=] {
      glDrawElementsInstanced(mode, count, type, bufferOffset(offset), instanceCount);
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD(drawRangeElements, 6) {
    EXJS_UNPACK_ARGV(GLenum mode, GLuint start, GLuint end, GLsizei count, GLenum type, GLint offset);
    addToNextBatch([=] {
      glDrawRangeElements(mode, start, end, count, type, bufferOffset(offset));
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD(drawBuffers, 1) {
    size_t length;
    auto data = jsValueToSharedArray(jsCtx, jsArgv[0], &length);
    addToNextBatch([=] { glDrawBuffers((GLsizei) length, (GLenum *) data.get()); });
    return nullptr;
  }
  
#define _WRAP_METHOD_CLEAR_BUFFER(suffix, Type)                         \
  _WRAP_WEBGL2_METHOD(clearBuffer##suffix, 4) {                         \
    EXJS_UNPACK_ARGV(GLenum buffer, GLint drawbuffer);                  \
    auto values = jsValueToSharedArray(jsCtx, jsArgv[2], nullptr);      \
    addToNextBatch([=] {                                                \
      glClearBuffer##suffix(buffer, drawbuffer, (Type *) values.get()); \
    });                                                                 \
    return nullptr;                                                     \
  }
  
  _WRAP_METHOD_CLEAR_BUFFER(fv, GLfloat)
  _WRAP_METHOD_CLEAR_BUFFER(iv, GLint)
  _WRAP_METHOD_CLEAR_BUFFER(uiv, GLuint)
#undef _WRAP_METHOD_CLEAR_BUFFER
  
  _WRAP_WEBGL2_METHOD_SIMPLE(clearBufferfi, glClearBufferfi, buffer, drawbuffer, depth, stencil)


  // Query objects (WebGL2)
  // ----------------------

  _WRAP_WEBGL2_METHOD(createQuery, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint query;
      glGenQueries(1, &query);
      return query;
    });
  }

  _WRAP_WEBGL2_METHOD(deleteQuery, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fQuery);
    addToNextBatch([=] {
      GLuint query = lookupObject(fQuery);
      glDeleteQueries(1, &query);
    });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD_IS_OBJECT(Query)

  _WRAP_WEBGL2_METHOD(beginQuery, 2) {
    EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId query);
    addToNextBatch([=] { glBeginQuery(target, lookupObject(query)); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD_SIMPLE(endQuery, glEndQuery, target)

  _WRAP_WEBGL2_METHOD(getQuery, 2) {
    EXJS_UNPACK_ARGV(GLenum target, GLenum pname);
    GLint params;
    addBlockingToNextBatch([&] { glGetQueryiv(target, pname, &params); });
    return params == 0 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, params);
  }

  _WRAP_WEBGL2_METHOD(getQueryParameter, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId query, GLenum pname);
    GLuint params;
    addBlockingToNextBatch([&] { glGetQueryObjectuiv(lookupObject(query), pname, &params); });
    return params == 0 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, params);
  }


  // Samplers (WebGL2)
  // -----------------

  _WRAP_WEBGL2_METHOD(createSampler, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint sampler;
      glGenSamplers(1, &sampler);
      return sampler;
    });
  }

  _WRAP_WEBGL2_METHOD(deleteSampler, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fSampler);
    addToNextBatch([=] {
      GLuint sampler = lookupObject(fSampler);
      glDeleteSamplers(1, &sampler);
    });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(bindSampler, 2) {
    EXJS_UNPACK_ARGV(GLuint unit, UEXGLObjectId sampler);
    addToNextBatch([=] { glBindSampler(unit, lookupObject(sampler)); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD_IS_OBJECT(Sampler)

  _WRAP_WEBGL2_METHOD(samplerParameteri, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId sampler, GLenum pname, GLint param);
    addToNextBatch([=] { glSamplerParameteri(lookupObject(sampler), pname, param); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(samplerParameterf, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId sampler, GLenum pname, GLfloat param);
    addToNextBatch([=] { glSamplerParameterf(lookupObject(sampler), pname, param); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(getSamplerParameter, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fSampler, GLenum pname);
    bool isFloatParam = pname == GL_TEXTURE_MAX_LOD || pname == GL_TEXTURE_MIN_LOD;
    GLfloat paramf;
    GLint parami;

    addBlockingToNextBatch([&] {
      GLuint sampler = lookupObject(fSampler);

      if (isFloatParam) {
        glGetSamplerParameterfv(sampler, pname, &paramf);
      } else {
        glGetSamplerParameteriv(sampler, pname, &parami);
      }
    });
    return JSValueMakeNumber(jsCtx, isFloatParam ? paramf : parami);
  }


  // Sync objects (WebGL2)
  // ---------------------

  _WRAP_METHOD_UNIMPL(fenceSync)

  _WRAP_METHOD_UNIMPL(isSync)

  _WRAP_METHOD_UNIMPL(deleteSync)

  _WRAP_METHOD_UNIMPL(clientWaitSync)

  _WRAP_METHOD_UNIMPL(waitSync)

  _WRAP_METHOD_UNIMPL(getSyncParameter)


  // Transform feedback (WebGL2)
  // ---------------------------

  _WRAP_WEBGL2_METHOD(createTransformFeedback, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint transformFeedback;
      glGenTransformFeedbacks(1, &transformFeedback);
      return transformFeedback;
    });
  }

  _WRAP_WEBGL2_METHOD(deleteTransformFeedback, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fTransformFeedback);
    addToNextBatch([=] {
      GLuint transformFeedback = lookupObject(fTransformFeedback);
      glDeleteTransformFeedbacks(1, &transformFeedback);
    });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD_IS_OBJECT(TransformFeedback)

  _WRAP_WEBGL2_METHOD(bindTransformFeedback, 1) {
    EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId transformFeedback);
    addToNextBatch([=] { glBindTransformFeedback(target, lookupObject(transformFeedback)); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD_SIMPLE(beginTransformFeedback, glBeginTransformFeedback, primitiveMode)

  _WRAP_WEBGL2_METHOD(endTransformFeedback, 0) {
    addToNextBatch([=] { glEndTransformFeedback(); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(transformFeedbackVaryings, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program);
    EXJS_UNPACK_ARGV_OFFSET(2, GLenum bufferMode);
    int length;
    auto varyings = jsValueToSharedStringArray(jsCtx, jsArgv[1], &length);

    addToNextBatch([=] {
      glTransformFeedbackVaryings(lookupObject(program), length, (const GLchar *const *) varyings.get(), bufferMode);
    });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(getTransformFeedbackVarying, 2) {
    return getActiveInfo(jsCtx, jsArgv, GL_TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH, glGetTransformFeedbackVarying);
  }

  _WRAP_WEBGL2_METHOD(pauseTransformFeedback, 0) {
    addToNextBatch([=] { glPauseTransformFeedback(); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(resumeTransformFeedback, 0) {
    addToNextBatch([=] { glResumeTransformFeedback(); });
    return nullptr;
  }


  // Uniform buffer objects (WebGL2)
  // -------------------------------

  _WRAP_WEBGL2_METHOD(bindBufferBase, 3) {
    EXJS_UNPACK_ARGV(GLenum target, GLuint index, UEXGLObjectId buffer);
    addToNextBatch([=] { glBindBufferBase(target, index, lookupObject(buffer)); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(bindBufferRange, 5) {
    EXJS_UNPACK_ARGV(GLenum target, GLuint index, UEXGLObjectId buffer, GLint offset, GLsizei size);
    addToNextBatch([=] { glBindBufferRange(target, index, lookupObject(buffer), offset, size); });
    return nullptr;
  }

  _WRAP_WEBGL2_METHOD(getUniformIndices, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program);
    int length;
    auto uniformNames = jsValueToSharedStringArray(jsCtx, jsArgv[1], &length);
    GLuint indices[length];

    addBlockingToNextBatch([&] {
      glGetUniformIndices(lookupObject(program), length, (const GLchar *const *) uniformNames.get(), indices);
    });
    return makeTypedArray(jsCtx, kJSTypedArrayTypeUint32Array, indices, sizeof(indices));
  }

  _WRAP_WEBGL2_METHOD(getActiveUniforms, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program);
    EXJS_UNPACK_ARGV_OFFSET(2, GLenum pname);
    size_t length;
    auto uniformIndices = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
    int count = (int) length / sizeof(GLuint);
    GLint params[count];

    addBlockingToNextBatch([&] {
      glGetActiveUniformsiv(lookupObject(program), (GLsizei) count, (const GLuint *) uniformIndices.get(), pname, params);
    });
    return makeTypedArray(jsCtx, kJSTypedArrayTypeInt32Array, params, sizeof(params));
  }

  _WRAP_WEBGL2_METHOD(getUniformBlockIndex, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program);
    auto uniformBlockName = jsValueToSharedStr(jsCtx, jsArgv[1]);
    GLuint blockIndex;

    addBlockingToNextBatch([&] {
      blockIndex = glGetUniformBlockIndex(lookupObject(program), uniformBlockName.get());
    });
    return JSValueMakeNumber(jsCtx, blockIndex);
  }

  _WRAP_METHOD_UNIMPL(getActiveUniformBlockParameter)

  _WRAP_WEBGL2_METHOD(getActiveUniformBlockName, 2) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLuint uniformBlockIndex);
    std::string blockName;

    addBlockingToNextBatch([&] {
      GLuint program = lookupObject(fProgram);
      GLint bufSize;
      glGetActiveUniformBlockiv(program, uniformBlockIndex, GL_UNIFORM_BLOCK_NAME_LENGTH, &bufSize);
      glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, NULL, &blockName[0]);
    });
    return EXJSValueMakeStringFromUTF8CString(jsCtx, blockName.c_str());
  }

  _WRAP_WEBGL2_METHOD(uniformBlockBinding, 3) {
    EXJS_UNPACK_ARGV(UEXGLObjectId program, GLuint uniformBlockIndex, GLuint uniformBlockBinding);
    addToNextBatch([=] {
      glUniformBlockBinding(lookupObject(program), uniformBlockIndex, uniformBlockBinding);
    });
    return nullptr;
  }


  // Vertex Array Object (WebGL2)
  // ----------------------------
  
  _WRAP_WEBGL2_METHOD(createVertexArray, 0) {
    return addFutureToNextBatch(jsCtx, [] {
      GLuint vertexArray;
      glGenVertexArrays(1, &vertexArray);
      return vertexArray;
    });
  }
  
  _WRAP_WEBGL2_METHOD(deleteVertexArray, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId fVertexArray);
    addToNextBatch([=] {
      GLuint vertexArray = lookupObject(fVertexArray);
      glDeleteVertexArrays(1, &vertexArray);
    });
    return nullptr;
  }
  
  _WRAP_WEBGL2_METHOD_IS_OBJECT(VertexArray)
  
  _WRAP_WEBGL2_METHOD(bindVertexArray, 1) {
    EXJS_UNPACK_ARGV(UEXGLObjectId vertexArray);
    addToNextBatch([=] { glBindVertexArray(lookupObject(vertexArray)); });
    return nullptr;
  }


  // Extensions
  // ----------

  _WRAP_METHOD(getSupportedExtensions, 0) {
    return JSObjectMakeArray(jsCtx, 0, NULL, NULL);
  }

  _WRAP_METHOD(getExtension, 1) {
    return JSValueMakeNull(jsCtx);
  }


  // Exponent extensions
  // -------------------

  _WRAP_METHOD(endFrameEXP, 0) {
    addToNextBatch([=] {
      setNeedsRedraw(true);
    });
    endNextBatch();
    flushOnGLThread();
    return nullptr;
  }

  _WRAP_METHOD(flushEXP, 0) {
    addBlockingToNextBatch([&] {
      // nothing, it's just a helper so that we can measure how much time some operations take
    });
    return nullptr;
  }


#undef _WRAP_METHOD_SIMPLE_UNPACK
#undef _WRAP_METHOD_SIMPLE
#undef _WRAP_METHOD_UNIMPL
#undef _WRAP_METHOD


  void installMethods(JSContextRef jsCtx) {
#define _INSTALL_METHOD(name)                                           \
    EXJSObjectSetFunctionWithUTF8CStringName(jsCtx, jsGl, #name,        \
                                             &EXGLContext::exglNativeStatic_##name)

    // This listing follows the order in
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext

    // The WebGL context
    _INSTALL_METHOD(getContextAttributes);
    _INSTALL_METHOD(isContextLost);

    // Viewing and clipping
    _INSTALL_METHOD(scissor);
    _INSTALL_METHOD(viewport);

    // State information
    _INSTALL_METHOD(activeTexture);
    _INSTALL_METHOD(blendColor);
    _INSTALL_METHOD(blendEquation);
    _INSTALL_METHOD(blendEquationSeparate);
    _INSTALL_METHOD(blendFunc);
    _INSTALL_METHOD(blendFuncSeparate);
    _INSTALL_METHOD(clearColor);
    _INSTALL_METHOD(clearDepth);
    _INSTALL_METHOD(clearStencil);
    _INSTALL_METHOD(colorMask);
    _INSTALL_METHOD(cullFace);
    _INSTALL_METHOD(depthFunc);
    _INSTALL_METHOD(depthMask);
    _INSTALL_METHOD(depthRange);
    _INSTALL_METHOD(disable);
    _INSTALL_METHOD(enable);
    _INSTALL_METHOD(frontFace);
    _INSTALL_METHOD(getParameter);
    _INSTALL_METHOD(getError);
    _INSTALL_METHOD(hint);
    _INSTALL_METHOD(isEnabled);
    _INSTALL_METHOD(lineWidth);
    _INSTALL_METHOD(pixelStorei);
    _INSTALL_METHOD(polygonOffset);
    _INSTALL_METHOD(sampleCoverage);
    _INSTALL_METHOD(stencilFunc);
    _INSTALL_METHOD(stencilFuncSeparate);
    _INSTALL_METHOD(stencilMask);
    _INSTALL_METHOD(stencilMaskSeparate);
    _INSTALL_METHOD(stencilOp);
    _INSTALL_METHOD(stencilOpSeparate);

    // Buffers
    _INSTALL_METHOD(bindBuffer);
    _INSTALL_METHOD(bufferData);
    _INSTALL_METHOD(bufferSubData);
    _INSTALL_METHOD(createBuffer);
    _INSTALL_METHOD(deleteBuffer);
    _INSTALL_METHOD(getBufferParameter);
    _INSTALL_METHOD(isBuffer);

    // Buffers (WebGL2)
    _INSTALL_METHOD(copyBufferSubData);
    _INSTALL_METHOD(getBufferSubData);

    // Framebuffers
    _INSTALL_METHOD(bindFramebuffer);
    _INSTALL_METHOD(checkFramebufferStatus);
    _INSTALL_METHOD(createFramebuffer);
    _INSTALL_METHOD(deleteFramebuffer);
    _INSTALL_METHOD(framebufferRenderbuffer);
    _INSTALL_METHOD(framebufferTexture2D);
    _INSTALL_METHOD(getFramebufferAttachmentParameter);
    _INSTALL_METHOD(isFramebuffer);
    _INSTALL_METHOD(readPixels);
    
    // Framebuffers (WebGL2)
    _INSTALL_METHOD(blitFramebuffer);
    _INSTALL_METHOD(framebufferTextureLayer);
    _INSTALL_METHOD(invalidateFramebuffer);
    _INSTALL_METHOD(invalidateSubFramebuffer);
    _INSTALL_METHOD(readBuffer);

    // Renderbuffers
    _INSTALL_METHOD(bindRenderbuffer);
    _INSTALL_METHOD(createRenderbuffer);
    _INSTALL_METHOD(deleteRenderbuffer);
    _INSTALL_METHOD(getRenderbufferParameter);
    _INSTALL_METHOD(isRenderbuffer);
    _INSTALL_METHOD(renderbufferStorage);
    
    // Renderbuffers (WebGL2)
    _INSTALL_METHOD(getInternalformatParameter);
    _INSTALL_METHOD(renderbufferStorageMultisample);

    // Textures
    _INSTALL_METHOD(bindTexture);
    _INSTALL_METHOD(compressedTexImage2D);
    _INSTALL_METHOD(compressedTexSubImage2D);
    _INSTALL_METHOD(copyTexImage2D);
    _INSTALL_METHOD(copyTexSubImage2D);
    _INSTALL_METHOD(createTexture);
    _INSTALL_METHOD(deleteTexture);
    _INSTALL_METHOD(generateMipmap);
    _INSTALL_METHOD(getTexParameter);
    _INSTALL_METHOD(isTexture);
    _INSTALL_METHOD(texImage2D);
    _INSTALL_METHOD(texSubImage2D);
    _INSTALL_METHOD(texParameterf);
    _INSTALL_METHOD(texParameteri);

    // Textures (WebGL2)
    _INSTALL_METHOD(texStorage2D);
    _INSTALL_METHOD(texStorage3D);
    _INSTALL_METHOD(texImage3D);
    _INSTALL_METHOD(texSubImage3D);
    _INSTALL_METHOD(copyTexSubImage3D);
    _INSTALL_METHOD(compressedTexImage3D);
    _INSTALL_METHOD(compressedTexSubImage3D);

    // Programs and shaders
    _INSTALL_METHOD(attachShader);
    _INSTALL_METHOD(bindAttribLocation);
    _INSTALL_METHOD(compileShader);
    _INSTALL_METHOD(createProgram);
    _INSTALL_METHOD(createShader);
    _INSTALL_METHOD(deleteProgram);
    _INSTALL_METHOD(deleteShader);
    _INSTALL_METHOD(detachShader);
    _INSTALL_METHOD(getAttachedShaders);
    _INSTALL_METHOD(getProgramParameter);
    _INSTALL_METHOD(getProgramInfoLog);
    _INSTALL_METHOD(getShaderParameter);
    _INSTALL_METHOD(getShaderPrecisionFormat);
    _INSTALL_METHOD(getShaderInfoLog);
    _INSTALL_METHOD(getShaderSource);
    _INSTALL_METHOD(isProgram);
    _INSTALL_METHOD(isShader);
    _INSTALL_METHOD(linkProgram);
    _INSTALL_METHOD(shaderSource);
    _INSTALL_METHOD(useProgram);
    _INSTALL_METHOD(validateProgram);

    // Programs and shaders (WebGL2)
    _INSTALL_METHOD(getFragDataLocation);

    // Uniforms and attributes
    _INSTALL_METHOD(disableVertexAttribArray);
    _INSTALL_METHOD(enableVertexAttribArray);
    _INSTALL_METHOD(getActiveAttrib);
    _INSTALL_METHOD(getActiveUniform);
    _INSTALL_METHOD(getAttribLocation);
    _INSTALL_METHOD(getUniform);
    _INSTALL_METHOD(getUniformLocation);
    _INSTALL_METHOD(getVertexAttrib);
    _INSTALL_METHOD(getVertexAttribOffset);
    _INSTALL_METHOD(uniform1f);
    _INSTALL_METHOD(uniform1fv);
    _INSTALL_METHOD(uniform1i);
    _INSTALL_METHOD(uniform1iv);
    _INSTALL_METHOD(uniform2f);
    _INSTALL_METHOD(uniform2fv);
    _INSTALL_METHOD(uniform2i);
    _INSTALL_METHOD(uniform2iv);
    _INSTALL_METHOD(uniform3f);
    _INSTALL_METHOD(uniform3fv);
    _INSTALL_METHOD(uniform3i);
    _INSTALL_METHOD(uniform3iv);
    _INSTALL_METHOD(uniform4f);
    _INSTALL_METHOD(uniform4fv);
    _INSTALL_METHOD(uniform4i);
    _INSTALL_METHOD(uniform4iv);
    _INSTALL_METHOD(uniformMatrix2fv);
    _INSTALL_METHOD(uniformMatrix3fv);
    _INSTALL_METHOD(uniformMatrix4fv);
    _INSTALL_METHOD(vertexAttrib1f);
    _INSTALL_METHOD(vertexAttrib1fv);
    _INSTALL_METHOD(vertexAttrib2f);
    _INSTALL_METHOD(vertexAttrib2fv);
    _INSTALL_METHOD(vertexAttrib3f);
    _INSTALL_METHOD(vertexAttrib3fv);
    _INSTALL_METHOD(vertexAttrib4f);
    _INSTALL_METHOD(vertexAttrib4fv);
    _INSTALL_METHOD(vertexAttribPointer);

    // Uniforms and attributes (WebGL2)
    _INSTALL_METHOD(uniform1ui);
    _INSTALL_METHOD(uniform2ui);
    _INSTALL_METHOD(uniform3ui);
    _INSTALL_METHOD(uniform4ui);
    _INSTALL_METHOD(uniform1uiv);
    _INSTALL_METHOD(uniform2uiv);
    _INSTALL_METHOD(uniform3uiv);
    _INSTALL_METHOD(uniform4uiv);
    _INSTALL_METHOD(uniformMatrix3x2fv);
    _INSTALL_METHOD(uniformMatrix4x2fv);
    _INSTALL_METHOD(uniformMatrix2x3fv);
    _INSTALL_METHOD(uniformMatrix4x3fv);
    _INSTALL_METHOD(uniformMatrix2x4fv);
    _INSTALL_METHOD(uniformMatrix3x4fv);
    _INSTALL_METHOD(vertexAttribI4i);
    _INSTALL_METHOD(vertexAttribI4ui);
    _INSTALL_METHOD(vertexAttribI4iv);
    _INSTALL_METHOD(vertexAttribI4uiv);
    _INSTALL_METHOD(vertexAttribIPointer);

    // Drawing buffers
    _INSTALL_METHOD(clear);
    _INSTALL_METHOD(drawArrays);
    _INSTALL_METHOD(drawElements);
    _INSTALL_METHOD(finish);
    _INSTALL_METHOD(flush);
    
    // Drawing buffers (WebGL2)
    _INSTALL_METHOD(vertexAttribDivisor);
    _INSTALL_METHOD(drawArraysInstanced);
    _INSTALL_METHOD(drawElementsInstanced);
    _INSTALL_METHOD(drawRangeElements);
    _INSTALL_METHOD(drawBuffers);
    _INSTALL_METHOD(clearBufferfv);
    _INSTALL_METHOD(clearBufferiv);
    _INSTALL_METHOD(clearBufferuiv);
    _INSTALL_METHOD(clearBufferfi);

    // Query objects (WebGL2)
    _INSTALL_METHOD(createQuery);
    _INSTALL_METHOD(deleteQuery);
    _INSTALL_METHOD(isQuery);
    _INSTALL_METHOD(beginQuery);
    _INSTALL_METHOD(endQuery);
    _INSTALL_METHOD(getQuery);
    _INSTALL_METHOD(getQueryParameter);
    
    // Samplers (WebGL2)
    _INSTALL_METHOD(createSampler);
    _INSTALL_METHOD(deleteSampler);
    _INSTALL_METHOD(bindSampler);
    _INSTALL_METHOD(isSampler);
    _INSTALL_METHOD(samplerParameteri);
    _INSTALL_METHOD(samplerParameterf);
    _INSTALL_METHOD(getSamplerParameter);

    // Sync objects (WebGL2)
    _INSTALL_METHOD(fenceSync);
    _INSTALL_METHOD(isSync);
    _INSTALL_METHOD(deleteSync);
    _INSTALL_METHOD(clientWaitSync);
    _INSTALL_METHOD(waitSync);
    _INSTALL_METHOD(getSyncParameter);

    // Transform feedback (WebGL2)
    _INSTALL_METHOD(createTransformFeedback);
    _INSTALL_METHOD(deleteTransformFeedback);
    _INSTALL_METHOD(isTransformFeedback);
    _INSTALL_METHOD(bindTransformFeedback);
    _INSTALL_METHOD(beginTransformFeedback);
    _INSTALL_METHOD(endTransformFeedback);
    _INSTALL_METHOD(transformFeedbackVaryings);
    _INSTALL_METHOD(getTransformFeedbackVarying);
    _INSTALL_METHOD(pauseTransformFeedback);
    _INSTALL_METHOD(resumeTransformFeedback);

    // Uniform buffer objects (WebGL2)
    _INSTALL_METHOD(bindBufferBase);
    _INSTALL_METHOD(bindBufferRange);
    _INSTALL_METHOD(getUniformIndices);
    _INSTALL_METHOD(getActiveUniforms);
    _INSTALL_METHOD(getUniformBlockIndex);
    _INSTALL_METHOD(getActiveUniformBlockParameter);
    _INSTALL_METHOD(getActiveUniformBlockName);
    _INSTALL_METHOD(uniformBlockBinding);

    // Vertex Array Object (WebGL2)
    _INSTALL_METHOD(createVertexArray);
    _INSTALL_METHOD(deleteVertexArray);
    _INSTALL_METHOD(isVertexArray);
    _INSTALL_METHOD(bindVertexArray);

    // Extensions
    _INSTALL_METHOD(getSupportedExtensions);
    _INSTALL_METHOD(getExtension);

    // Exponent extensions
    _INSTALL_METHOD(endFrameEXP);
    _INSTALL_METHOD(flushEXP);

#undef _INSTALL_METHOD
  }


  void installConstants(JSContextRef jsCtx) {
#define _INSTALL_CONSTANT(name)                                         \
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsGl, #name,           \
                                          JSValueMakeNumber(jsCtx, GL_ ## name))

    _INSTALL_CONSTANT(ACTIVE_ATTRIBUTES); //35721
    // _INSTALL_CONSTANT(ACTIVE_ATTRIBUTE_MAX_LENGTH); //35722
    _INSTALL_CONSTANT(ACTIVE_TEXTURE); //34016
    _INSTALL_CONSTANT(ACTIVE_UNIFORMS); //35718
    _INSTALL_CONSTANT(ACTIVE_UNIFORM_BLOCKS); //35382
    // _INSTALL_CONSTANT(ACTIVE_UNIFORM_MAX_LENGTH); //35719
    _INSTALL_CONSTANT(ALIASED_LINE_WIDTH_RANGE); //33902
    _INSTALL_CONSTANT(ALIASED_POINT_SIZE_RANGE); //33901
    _INSTALL_CONSTANT(ALPHA); //6406
    _INSTALL_CONSTANT(ALPHA_BITS); //3413
    _INSTALL_CONSTANT(ALREADY_SIGNALED); //37146
    _INSTALL_CONSTANT(ALWAYS); //519
    _INSTALL_CONSTANT(ANY_SAMPLES_PASSED); //35887
    _INSTALL_CONSTANT(ANY_SAMPLES_PASSED_CONSERVATIVE); //36202
    _INSTALL_CONSTANT(ARRAY_BUFFER); //34962
    _INSTALL_CONSTANT(ARRAY_BUFFER_BINDING); //34964
    _INSTALL_CONSTANT(ATTACHED_SHADERS); //35717
    _INSTALL_CONSTANT(BACK); //1029
    _INSTALL_CONSTANT(BLEND); //3042
    _INSTALL_CONSTANT(BLEND_COLOR); //32773
    _INSTALL_CONSTANT(BLEND_DST_ALPHA); //32970
    _INSTALL_CONSTANT(BLEND_DST_RGB); //32968
    _INSTALL_CONSTANT(BLEND_EQUATION); //32777
    _INSTALL_CONSTANT(BLEND_EQUATION_ALPHA); //34877
    _INSTALL_CONSTANT(BLEND_EQUATION_RGB); //32777
    _INSTALL_CONSTANT(BLEND_SRC_ALPHA); //32971
    _INSTALL_CONSTANT(BLEND_SRC_RGB); //32969
    _INSTALL_CONSTANT(BLUE_BITS); //3412
    _INSTALL_CONSTANT(BOOL); //35670
    _INSTALL_CONSTANT(BOOL_VEC2); //35671
    _INSTALL_CONSTANT(BOOL_VEC3); //35672
    _INSTALL_CONSTANT(BOOL_VEC4); //35673
    _INSTALL_CONSTANT(BROWSER_DEFAULT_WEBGL); //37444
    _INSTALL_CONSTANT(BUFFER_SIZE); //34660
    _INSTALL_CONSTANT(BUFFER_USAGE); //34661
    _INSTALL_CONSTANT(BYTE); //5120
    _INSTALL_CONSTANT(CCW); //2305
    _INSTALL_CONSTANT(CLAMP_TO_EDGE); //33071
    _INSTALL_CONSTANT(COLOR); //6144
    _INSTALL_CONSTANT(COLOR_ATTACHMENT0); //36064
    _INSTALL_CONSTANT(COLOR_ATTACHMENT1); //36065
    _INSTALL_CONSTANT(COLOR_ATTACHMENT2); //36066
    _INSTALL_CONSTANT(COLOR_ATTACHMENT3); //36067
    _INSTALL_CONSTANT(COLOR_ATTACHMENT4); //36068
    _INSTALL_CONSTANT(COLOR_ATTACHMENT5); //36069
    _INSTALL_CONSTANT(COLOR_ATTACHMENT6); //36070
    _INSTALL_CONSTANT(COLOR_ATTACHMENT7); //36071
    _INSTALL_CONSTANT(COLOR_ATTACHMENT8); //36072
    _INSTALL_CONSTANT(COLOR_ATTACHMENT9); //36073
    _INSTALL_CONSTANT(COLOR_ATTACHMENT10); //36074
    _INSTALL_CONSTANT(COLOR_ATTACHMENT11); //36075
    _INSTALL_CONSTANT(COLOR_ATTACHMENT12); //36076
    _INSTALL_CONSTANT(COLOR_ATTACHMENT13); //36077
    _INSTALL_CONSTANT(COLOR_ATTACHMENT14); //36078
    _INSTALL_CONSTANT(COLOR_ATTACHMENT15); //36079
    _INSTALL_CONSTANT(COLOR_BUFFER_BIT); //16384
    _INSTALL_CONSTANT(COLOR_CLEAR_VALUE); //3106
    _INSTALL_CONSTANT(COLOR_WRITEMASK); //3107
    _INSTALL_CONSTANT(COMPARE_REF_TO_TEXTURE); //34894
    _INSTALL_CONSTANT(COMPILE_STATUS); //35713
    _INSTALL_CONSTANT(COMPRESSED_TEXTURE_FORMATS); //34467
    _INSTALL_CONSTANT(CONDITION_SATISFIED); //37148
    _INSTALL_CONSTANT(CONSTANT_ALPHA); //32771
    _INSTALL_CONSTANT(CONSTANT_COLOR); //32769
    _INSTALL_CONSTANT(CONTEXT_LOST_WEBGL); //37442
    _INSTALL_CONSTANT(COPY_READ_BUFFER); //36662
    _INSTALL_CONSTANT(COPY_READ_BUFFER_BINDING); //36662
    _INSTALL_CONSTANT(COPY_WRITE_BUFFER); //36663
    _INSTALL_CONSTANT(COPY_WRITE_BUFFER_BINDING); //36663
    _INSTALL_CONSTANT(CULL_FACE); //2884
    _INSTALL_CONSTANT(CULL_FACE_MODE); //2885
    _INSTALL_CONSTANT(CURRENT_PROGRAM); //35725
    _INSTALL_CONSTANT(CURRENT_QUERY); //34917
    _INSTALL_CONSTANT(CURRENT_VERTEX_ATTRIB); //34342
    _INSTALL_CONSTANT(CW); //2304
    _INSTALL_CONSTANT(DECR); //7683
    _INSTALL_CONSTANT(DECR_WRAP); //34056
    _INSTALL_CONSTANT(DELETE_STATUS); //35712
    _INSTALL_CONSTANT(DEPTH); //6145
    _INSTALL_CONSTANT(DEPTH24_STENCIL8); //35056
    _INSTALL_CONSTANT(DEPTH32F_STENCIL8); //36013
    _INSTALL_CONSTANT(DEPTH_ATTACHMENT); //36096
    _INSTALL_CONSTANT(DEPTH_BITS); //3414
    _INSTALL_CONSTANT(DEPTH_BUFFER_BIT); //256
    _INSTALL_CONSTANT(DEPTH_COMPONENT24); //33190
    _INSTALL_CONSTANT(DEPTH_COMPONENT32F); //36012
    _INSTALL_CONSTANT(DEPTH_CLEAR_VALUE); //2931
    _INSTALL_CONSTANT(DEPTH_COMPONENT); //6402
    _INSTALL_CONSTANT(DEPTH_COMPONENT16); //33189
    _INSTALL_CONSTANT(DEPTH_FUNC); //2932
    _INSTALL_CONSTANT(DEPTH_RANGE); //2928
    _INSTALL_CONSTANT(DEPTH_STENCIL); //34041
    _INSTALL_CONSTANT(DEPTH_STENCIL_ATTACHMENT); //33306
    _INSTALL_CONSTANT(DEPTH_TEST); //2929
    _INSTALL_CONSTANT(DEPTH_WRITEMASK); //2930
    _INSTALL_CONSTANT(DITHER); //3024
    _INSTALL_CONSTANT(DONT_CARE); //4352
    _INSTALL_CONSTANT(DRAW_BUFFER0); // 34853
    _INSTALL_CONSTANT(DRAW_BUFFER1); // 34854
    _INSTALL_CONSTANT(DRAW_BUFFER2); // 34855
    _INSTALL_CONSTANT(DRAW_BUFFER3); // 34856
    _INSTALL_CONSTANT(DRAW_BUFFER4); // 34857
    _INSTALL_CONSTANT(DRAW_BUFFER5); // 34858
    _INSTALL_CONSTANT(DRAW_BUFFER6); // 34859
    _INSTALL_CONSTANT(DRAW_BUFFER7); // 34860
    _INSTALL_CONSTANT(DRAW_BUFFER8); // 34861
    _INSTALL_CONSTANT(DRAW_BUFFER9); // 34862
    _INSTALL_CONSTANT(DRAW_BUFFER10); // 34863
    _INSTALL_CONSTANT(DRAW_BUFFER11); // 34864
    _INSTALL_CONSTANT(DRAW_BUFFER12); // 34865
    _INSTALL_CONSTANT(DRAW_BUFFER13); // 34866
    _INSTALL_CONSTANT(DRAW_BUFFER14); // 34867
    _INSTALL_CONSTANT(DRAW_BUFFER15); // 34868
    _INSTALL_CONSTANT(DRAW_FRAMEBUFFER); // 36009
    _INSTALL_CONSTANT(DRAW_FRAMEBUFFER_BINDING); //36006
    _INSTALL_CONSTANT(DST_ALPHA); //772
    _INSTALL_CONSTANT(DST_COLOR); //774
    _INSTALL_CONSTANT(DYNAMIC_COPY); //35050
    _INSTALL_CONSTANT(DYNAMIC_DRAW); //35048
    _INSTALL_CONSTANT(DYNAMIC_READ); //35049
    _INSTALL_CONSTANT(ELEMENT_ARRAY_BUFFER); //34963
    _INSTALL_CONSTANT(ELEMENT_ARRAY_BUFFER_BINDING); //34965
    _INSTALL_CONSTANT(EQUAL); //514
    // _INSTALL_CONSTANT(FALSE); //0
    _INSTALL_CONSTANT(FASTEST); //4353
    _INSTALL_CONSTANT(FLOAT); //5126
    _INSTALL_CONSTANT(FLOAT_32_UNSIGNED_INT_24_8_REV); //36269
    _INSTALL_CONSTANT(FLOAT_MAT2); //35674
    _INSTALL_CONSTANT(FLOAT_MAT2x3); //35685
    _INSTALL_CONSTANT(FLOAT_MAT2x4); //35686
    _INSTALL_CONSTANT(FLOAT_MAT3); //35675
    _INSTALL_CONSTANT(FLOAT_MAT3x2); //35687
    _INSTALL_CONSTANT(FLOAT_MAT3x4); //35688
    _INSTALL_CONSTANT(FLOAT_MAT4); //35676
    _INSTALL_CONSTANT(FLOAT_MAT4x2); //35689
    _INSTALL_CONSTANT(FLOAT_MAT4x3); //35690
    _INSTALL_CONSTANT(FLOAT_VEC2); //35664
    _INSTALL_CONSTANT(FLOAT_VEC3); //35665
    _INSTALL_CONSTANT(FLOAT_VEC4); //35666
    _INSTALL_CONSTANT(FRAGMENT_SHADER); //35632
    _INSTALL_CONSTANT(FRAGMENT_SHADER_DERIVATIVE_HINT); //35723
    _INSTALL_CONSTANT(FRAMEBUFFER); //36160
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE); //33301
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_BLUE_SIZE); //33300
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING); //33296
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE); //33297
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE); //33302
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_GREEN_SIZE); //33299
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_OBJECT_NAME); //36049
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE); //36048
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_RED_SIZE); //33298
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE); //33303
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE); //36051
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER); //36052
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL); //36050
    _INSTALL_CONSTANT(FRAMEBUFFER_BINDING); //36006
    _INSTALL_CONSTANT(FRAMEBUFFER_COMPLETE); //36053
    _INSTALL_CONSTANT(FRAMEBUFFER_DEFAULT); //33304
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_ATTACHMENT); //36054
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_DIMENSIONS); //36057
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT); //36055
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_MULTISAMPLE); //36182
    _INSTALL_CONSTANT(FRAMEBUFFER_UNSUPPORTED); //36061
    _INSTALL_CONSTANT(FRONT); //1028
    _INSTALL_CONSTANT(FRONT_AND_BACK); //1032
    _INSTALL_CONSTANT(FRONT_FACE); //2886
    _INSTALL_CONSTANT(FUNC_ADD); //32774
    _INSTALL_CONSTANT(FUNC_REVERSE_SUBTRACT); //32779
    _INSTALL_CONSTANT(FUNC_SUBTRACT); //32778
    _INSTALL_CONSTANT(GENERATE_MIPMAP_HINT); //33170
    _INSTALL_CONSTANT(GEQUAL); //518
    _INSTALL_CONSTANT(GREATER); //516
    _INSTALL_CONSTANT(GREEN_BITS); //3411
    _INSTALL_CONSTANT(HALF_FLOAT); //5131
    _INSTALL_CONSTANT(HIGH_FLOAT); //36338
    _INSTALL_CONSTANT(HIGH_INT); //36341
    _INSTALL_CONSTANT(IMPLEMENTATION_COLOR_READ_TYPE); //35738
    _INSTALL_CONSTANT(IMPLEMENTATION_COLOR_READ_FORMAT); //35739
    _INSTALL_CONSTANT(INCR); //7682
    _INSTALL_CONSTANT(INCR_WRAP); //34055
    // _INSTALL_CONSTANT(INFO_LOG_LENGTH); //35716
    _INSTALL_CONSTANT(INT); //5124
    _INSTALL_CONSTANT(INTERLEAVED_ATTRIBS); //35980
    _INSTALL_CONSTANT(INT_2_10_10_10_REV); //36255
    _INSTALL_CONSTANT(INT_SAMPLER_2D); //36298
    _INSTALL_CONSTANT(INT_SAMPLER_3D); //36299
    _INSTALL_CONSTANT(INT_SAMPLER_CUBE); //36300
    _INSTALL_CONSTANT(INT_SAMPLER_2D_ARRAY); //36303
    _INSTALL_CONSTANT(INT_VEC2); //35667
    _INSTALL_CONSTANT(INT_VEC3); //35668
    _INSTALL_CONSTANT(INT_VEC4); //35669
    _INSTALL_CONSTANT(INVALID_ENUM); //1280
    _INSTALL_CONSTANT(INVALID_FRAMEBUFFER_OPERATION); //1286
    _INSTALL_CONSTANT(INVALID_INDEX); //4294967295
    _INSTALL_CONSTANT(INVALID_OPERATION); //1282
    _INSTALL_CONSTANT(INVALID_VALUE); //1281
    _INSTALL_CONSTANT(INVERT); //5386
    _INSTALL_CONSTANT(KEEP); //7680
    _INSTALL_CONSTANT(LEQUAL); //515
    _INSTALL_CONSTANT(LESS); //513
    _INSTALL_CONSTANT(LINEAR); //9729
    _INSTALL_CONSTANT(LINEAR_MIPMAP_LINEAR); //9987
    _INSTALL_CONSTANT(LINEAR_MIPMAP_NEAREST); //9985
    _INSTALL_CONSTANT(LINES); //1
    _INSTALL_CONSTANT(LINE_LOOP); //2
    _INSTALL_CONSTANT(LINE_STRIP); //3
    _INSTALL_CONSTANT(LINE_WIDTH); //2849
    _INSTALL_CONSTANT(LINK_STATUS); //35714
    _INSTALL_CONSTANT(LOW_FLOAT); //36336
    _INSTALL_CONSTANT(LOW_INT); //36339
    _INSTALL_CONSTANT(LUMINANCE); //6409
    _INSTALL_CONSTANT(LUMINANCE_ALPHA); //6410
    _INSTALL_CONSTANT(MAX); //32776
    _INSTALL_CONSTANT(MAX_3D_TEXTURE_SIZE); //32883
    _INSTALL_CONSTANT(MAX_ARRAY_TEXTURE_LAYERS); //35071
    _INSTALL_CONSTANT(MAX_CLIENT_WAIT_TIMEOUT_WEBGL); //37447
    _INSTALL_CONSTANT(MAX_COLOR_ATTACHMENTS); //36063
    _INSTALL_CONSTANT(MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS); //35379
    _INSTALL_CONSTANT(MAX_COMBINED_TEXTURE_IMAGE_UNITS); //35661
    _INSTALL_CONSTANT(MAX_COMBINED_UNIFORM_BLOCKS); //35374
    _INSTALL_CONSTANT(MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS); //35377
    _INSTALL_CONSTANT(MAX_CUBE_MAP_TEXTURE_SIZE); //34076
    _INSTALL_CONSTANT(MAX_DRAW_BUFFERS); // 34852
    _INSTALL_CONSTANT(MAX_ELEMENTS_INDICES); //33001
    _INSTALL_CONSTANT(MAX_ELEMENTS_VERTICES); //33000
    _INSTALL_CONSTANT(MAX_ELEMENT_INDEX); //36203
    _INSTALL_CONSTANT(MAX_FRAGMENT_INPUT_COMPONENTS); //37157
    _INSTALL_CONSTANT(MAX_FRAGMENT_UNIFORM_BLOCKS); //35373
    _INSTALL_CONSTANT(MAX_FRAGMENT_UNIFORM_COMPONENTS); //35657
    _INSTALL_CONSTANT(MAX_FRAGMENT_UNIFORM_VECTORS); //36349
    _INSTALL_CONSTANT(MAX_PROGRAM_TEXEL_OFFSET); //35077
    _INSTALL_CONSTANT(MAX_RENDERBUFFER_SIZE); //34024
    _INSTALL_CONSTANT(MAX_SAMPLES); //36183
    _INSTALL_CONSTANT(MAX_SERVER_WAIT_TIMEOUT); //37137
    _INSTALL_CONSTANT(MAX_TEXTURE_IMAGE_UNITS); //34930
    _INSTALL_CONSTANT(MAX_TEXTURE_LOD_BIAS); //34045
    _INSTALL_CONSTANT(MAX_TEXTURE_SIZE); //3379
    _INSTALL_CONSTANT(MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS); //35978
    _INSTALL_CONSTANT(MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS); //35979
    _INSTALL_CONSTANT(MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS); //35968
    _INSTALL_CONSTANT(MAX_UNIFORM_BLOCK_SIZE); //35376
    _INSTALL_CONSTANT(MAX_UNIFORM_BUFFER_BINDINGS); //35375
    _INSTALL_CONSTANT(MAX_VARYING_COMPONENTS); //35659
    _INSTALL_CONSTANT(MAX_VARYING_VECTORS); //36348
    _INSTALL_CONSTANT(MAX_VERTEX_ATTRIBS); //34921
    _INSTALL_CONSTANT(MAX_VERTEX_OUTPUT_COMPONENTS); //37154
    _INSTALL_CONSTANT(MAX_VERTEX_TEXTURE_IMAGE_UNITS); //35660
    _INSTALL_CONSTANT(MAX_VERTEX_UNIFORM_BLOCKS); //35371
    _INSTALL_CONSTANT(MAX_VERTEX_UNIFORM_COMPONENTS); //35658
    _INSTALL_CONSTANT(MAX_VERTEX_UNIFORM_VECTORS); //36347
    _INSTALL_CONSTANT(MAX_VIEWPORT_DIMS); //3386
    _INSTALL_CONSTANT(MEDIUM_FLOAT); //36337
    _INSTALL_CONSTANT(MEDIUM_INT); //36340
    _INSTALL_CONSTANT(MIN); //32775
    _INSTALL_CONSTANT(MIN_PROGRAM_TEXEL_OFFSET); //35076
    _INSTALL_CONSTANT(MIRRORED_REPEAT); //33648
    _INSTALL_CONSTANT(NEAREST); //9728
    _INSTALL_CONSTANT(NEAREST_MIPMAP_LINEAR); //9986
    _INSTALL_CONSTANT(NEAREST_MIPMAP_NEAREST); //9984
    _INSTALL_CONSTANT(NEVER); //512
    _INSTALL_CONSTANT(NICEST); //4354
    _INSTALL_CONSTANT(NONE); //0
    _INSTALL_CONSTANT(NOTEQUAL); //517
    _INSTALL_CONSTANT(NO_ERROR); //0
    // _INSTALL_CONSTANT(NUM_COMPRESSED_TEXTURE_FORMATS); //34466
    _INSTALL_CONSTANT(OBJECT_TYPE); //37138
    _INSTALL_CONSTANT(ONE); //1
    _INSTALL_CONSTANT(ONE_MINUS_CONSTANT_ALPHA); //32772
    _INSTALL_CONSTANT(ONE_MINUS_CONSTANT_COLOR); //32770
    _INSTALL_CONSTANT(ONE_MINUS_DST_ALPHA); //773
    _INSTALL_CONSTANT(ONE_MINUS_DST_COLOR); //775
    _INSTALL_CONSTANT(ONE_MINUS_SRC_ALPHA); //771
    _INSTALL_CONSTANT(ONE_MINUS_SRC_COLOR); //769
    _INSTALL_CONSTANT(OUT_OF_MEMORY); //1285
    _INSTALL_CONSTANT(PACK_ALIGNMENT); //3333
    _INSTALL_CONSTANT(PACK_ROW_LENGTH); //3330
    _INSTALL_CONSTANT(PACK_SKIP_PIXELS); //3332
    _INSTALL_CONSTANT(PACK_SKIP_ROWS); //3331
    _INSTALL_CONSTANT(PIXEL_PACK_BUFFER); //35051
    _INSTALL_CONSTANT(PIXEL_PACK_BUFFER_BINDING); //35053
    _INSTALL_CONSTANT(PIXEL_UNPACK_BUFFER); //35052
    _INSTALL_CONSTANT(PIXEL_UNPACK_BUFFER_BINDING); //35055
    _INSTALL_CONSTANT(POINTS); //0
    _INSTALL_CONSTANT(POLYGON_OFFSET_FACTOR); //32824
    _INSTALL_CONSTANT(POLYGON_OFFSET_FILL); //32823
    _INSTALL_CONSTANT(POLYGON_OFFSET_UNITS); //10752
    _INSTALL_CONSTANT(QUERY_RESULT); //34918
    _INSTALL_CONSTANT(QUERY_RESULT_AVAILABLE); //34919
    _INSTALL_CONSTANT(R11F_G11F_B10F); //35898
    _INSTALL_CONSTANT(R16F); //33325
    _INSTALL_CONSTANT(R16I); //33331
    _INSTALL_CONSTANT(R16UI); //33332
    _INSTALL_CONSTANT(R32F); //33326
    _INSTALL_CONSTANT(R32I); //33333
    _INSTALL_CONSTANT(R32UI); //33334
    _INSTALL_CONSTANT(R8); //33321
    _INSTALL_CONSTANT(R8I); //33329
    _INSTALL_CONSTANT(R8UI); //33330
    _INSTALL_CONSTANT(R8_SNORM); //36756
    _INSTALL_CONSTANT(RASTERIZER_DISCARD); //35977
    _INSTALL_CONSTANT(READ_BUFFER); //3074
    _INSTALL_CONSTANT(READ_FRAMEBUFFER); //36008
    _INSTALL_CONSTANT(READ_FRAMEBUFFER_BINDING); //36010
    _INSTALL_CONSTANT(RED); //6403
    _INSTALL_CONSTANT(RED_BITS); //3410
    _INSTALL_CONSTANT(RED_INTEGER); //36244
    _INSTALL_CONSTANT(RENDERBUFFER); //36161
    _INSTALL_CONSTANT(RENDERBUFFER_ALPHA_SIZE); //36179
    _INSTALL_CONSTANT(RENDERBUFFER_BINDING); //36007
    _INSTALL_CONSTANT(RENDERBUFFER_BLUE_SIZE); //36178
    _INSTALL_CONSTANT(RENDERBUFFER_DEPTH_SIZE); //36180
    _INSTALL_CONSTANT(RENDERBUFFER_GREEN_SIZE); //36177
    _INSTALL_CONSTANT(RENDERBUFFER_HEIGHT); //36163
    _INSTALL_CONSTANT(RENDERBUFFER_INTERNAL_FORMAT); //36164
    _INSTALL_CONSTANT(RENDERBUFFER_RED_SIZE); //36176
    _INSTALL_CONSTANT(RENDERBUFFER_SAMPLES); //36011
    _INSTALL_CONSTANT(RENDERBUFFER_STENCIL_SIZE); //36181
    _INSTALL_CONSTANT(RENDERBUFFER_WIDTH); //36162
    _INSTALL_CONSTANT(RENDERER); //7937
    _INSTALL_CONSTANT(REPEAT); //10497
    _INSTALL_CONSTANT(REPLACE); //7681
    _INSTALL_CONSTANT(RG); //33319
    _INSTALL_CONSTANT(RG16F); //33327
    _INSTALL_CONSTANT(RG16I); //33337
    _INSTALL_CONSTANT(RG16UI); //33338
    _INSTALL_CONSTANT(RG32F); //33328
    _INSTALL_CONSTANT(RG32I); //33339
    _INSTALL_CONSTANT(RG32UI); //33340
    _INSTALL_CONSTANT(RG8); //33323
    _INSTALL_CONSTANT(RG8I); //33335
    _INSTALL_CONSTANT(RG8UI); //33336
    _INSTALL_CONSTANT(RG8_SNORM); //36757
    _INSTALL_CONSTANT(RGB); //6407
    _INSTALL_CONSTANT(RGB10_A2); //32857
    _INSTALL_CONSTANT(RGB10_A2UI); //36975
    _INSTALL_CONSTANT(RGB16F); //34843
    _INSTALL_CONSTANT(RGB16I); //36233
    _INSTALL_CONSTANT(RGB16UI); //36215
    _INSTALL_CONSTANT(RGB32F); //34837
    _INSTALL_CONSTANT(RGB32I); //36227
    _INSTALL_CONSTANT(RGB32UI); //36209
    _INSTALL_CONSTANT(RGB5_A1); //32855
    _INSTALL_CONSTANT(RGB565); //36194
    _INSTALL_CONSTANT(RGB8); //32849
    _INSTALL_CONSTANT(RGB8I); //36239
    _INSTALL_CONSTANT(RGB8UI); //36221
    _INSTALL_CONSTANT(RGB8_SNORM); //36758
    _INSTALL_CONSTANT(RGB9_E5); //35901
    _INSTALL_CONSTANT(RGBA); //6408
    _INSTALL_CONSTANT(RGBA4); //32854
    _INSTALL_CONSTANT(RGBA8); //32856
    _INSTALL_CONSTANT(RGBA8I); //36238
    _INSTALL_CONSTANT(RGBA8UI); //36220
    _INSTALL_CONSTANT(RGBA8_SNORM); //36759
    _INSTALL_CONSTANT(RGBA16F); //34842
    _INSTALL_CONSTANT(RGBA16I); //36232
    _INSTALL_CONSTANT(RGBA16UI); //36214
    _INSTALL_CONSTANT(RGBA32F); //34836
    _INSTALL_CONSTANT(RGBA32I); //36226
    _INSTALL_CONSTANT(RGBA32UI); //36208
    _INSTALL_CONSTANT(RGB_INTEGER); //36248
    _INSTALL_CONSTANT(RGBA_INTEGER); //36249
    _INSTALL_CONSTANT(RG_INTEGER); //33320
    _INSTALL_CONSTANT(SAMPLER_2D); //35678
    _INSTALL_CONSTANT(SAMPLER_2D_ARRAY); //36289
    _INSTALL_CONSTANT(SAMPLER_2D_ARRAY_SHADOW); //36292
    _INSTALL_CONSTANT(SAMPLER_2D_SHADOW); //35682
    _INSTALL_CONSTANT(SAMPLER_3D); //35679
    _INSTALL_CONSTANT(SAMPLER_BINDING); //35097
    _INSTALL_CONSTANT(SAMPLER_CUBE); //35680
    _INSTALL_CONSTANT(SAMPLER_CUBE_SHADOW); //36293
    _INSTALL_CONSTANT(SAMPLES); //32937
    _INSTALL_CONSTANT(SAMPLE_ALPHA_TO_COVERAGE); //32926
    _INSTALL_CONSTANT(SAMPLE_BUFFERS); //32936
    _INSTALL_CONSTANT(SAMPLE_COVERAGE); //32928
    _INSTALL_CONSTANT(SAMPLE_COVERAGE_INVERT); //32939
    _INSTALL_CONSTANT(SAMPLE_COVERAGE_VALUE); //32938
    _INSTALL_CONSTANT(SCISSOR_BOX); //3088
    _INSTALL_CONSTANT(SCISSOR_TEST); //3089
    _INSTALL_CONSTANT(SEPARATE_ATTRIBS); //35981
    // _INSTALL_CONSTANT(SHADER_COMPILER); //36346
    // _INSTALL_CONSTANT(SHADER_SOURCE_LENGTH); //35720
    _INSTALL_CONSTANT(SHADER_TYPE); //35663
    _INSTALL_CONSTANT(SHADING_LANGUAGE_VERSION); //35724
    _INSTALL_CONSTANT(SHORT); //5122
    _INSTALL_CONSTANT(SIGNALED); //37145
    _INSTALL_CONSTANT(SIGNED_NORMALIZED); //36764
    _INSTALL_CONSTANT(SRC_ALPHA); //770
    _INSTALL_CONSTANT(SRC_ALPHA_SATURATE); //776
    _INSTALL_CONSTANT(SRC_COLOR); //768
    _INSTALL_CONSTANT(SRGB); //35904
    _INSTALL_CONSTANT(SRGB8); //35905
    _INSTALL_CONSTANT(SRGB8_ALPHA8); //35907
    _INSTALL_CONSTANT(STATIC_COPY); //35046
    _INSTALL_CONSTANT(STATIC_DRAW); //35044
    _INSTALL_CONSTANT(STATIC_READ); //35045
    _INSTALL_CONSTANT(STENCIL); //6146
    _INSTALL_CONSTANT(STENCIL_ATTACHMENT); //36128
    _INSTALL_CONSTANT(STENCIL_BACK_FAIL); //34817
    _INSTALL_CONSTANT(STENCIL_BACK_FUNC); //34816
    _INSTALL_CONSTANT(STENCIL_BACK_PASS_DEPTH_FAIL); //34818
    _INSTALL_CONSTANT(STENCIL_BACK_PASS_DEPTH_PASS); //34819
    _INSTALL_CONSTANT(STENCIL_BACK_REF); //36003
    _INSTALL_CONSTANT(STENCIL_BACK_VALUE_MASK); //36004
    _INSTALL_CONSTANT(STENCIL_BACK_WRITEMASK); //36005
    _INSTALL_CONSTANT(STENCIL_BITS); //3415
    _INSTALL_CONSTANT(STENCIL_BUFFER_BIT); //1024
    _INSTALL_CONSTANT(STENCIL_CLEAR_VALUE); //2961
    _INSTALL_CONSTANT(STENCIL_FAIL); //2964
    _INSTALL_CONSTANT(STENCIL_FUNC); //2962
    _INSTALL_CONSTANT(STENCIL_INDEX); //6401
    _INSTALL_CONSTANT(STENCIL_INDEX8); //36168
    _INSTALL_CONSTANT(STENCIL_PASS_DEPTH_FAIL); //2965
    _INSTALL_CONSTANT(STENCIL_PASS_DEPTH_PASS); //2966
    _INSTALL_CONSTANT(STENCIL_REF); //2967
    _INSTALL_CONSTANT(STENCIL_TEST); //2960
    _INSTALL_CONSTANT(STENCIL_VALUE_MASK); //2963
    _INSTALL_CONSTANT(STENCIL_WRITEMASK); //2968
    _INSTALL_CONSTANT(STREAM_COPY); //35042
    _INSTALL_CONSTANT(STREAM_DRAW); //35040
    _INSTALL_CONSTANT(STREAM_READ); //35041
    _INSTALL_CONSTANT(SUBPIXEL_BITS); //3408
    _INSTALL_CONSTANT(SYNC_CONDITION); //37139
    _INSTALL_CONSTANT(SYNC_FENCE); //37142
    _INSTALL_CONSTANT(SYNC_FLAGS); //37141
    _INSTALL_CONSTANT(SYNC_FLUSH_COMMANDS_BIT); //1
    _INSTALL_CONSTANT(SYNC_GPU_COMMANDS_COMPLETE); //37143
    _INSTALL_CONSTANT(SYNC_STATUS); //37140
    _INSTALL_CONSTANT(TEXTURE); //5890
    _INSTALL_CONSTANT(TEXTURE0); //33984
    _INSTALL_CONSTANT(TEXTURE1); //33985
    _INSTALL_CONSTANT(TEXTURE2); //33986
    _INSTALL_CONSTANT(TEXTURE3); //33987
    _INSTALL_CONSTANT(TEXTURE4); //33988
    _INSTALL_CONSTANT(TEXTURE5); //33989
    _INSTALL_CONSTANT(TEXTURE6); //33990
    _INSTALL_CONSTANT(TEXTURE7); //33991
    _INSTALL_CONSTANT(TEXTURE8); //33992
    _INSTALL_CONSTANT(TEXTURE9); //33993
    _INSTALL_CONSTANT(TEXTURE10); //33994
    _INSTALL_CONSTANT(TEXTURE11); //33995
    _INSTALL_CONSTANT(TEXTURE12); //33996
    _INSTALL_CONSTANT(TEXTURE13); //33997
    _INSTALL_CONSTANT(TEXTURE14); //33998
    _INSTALL_CONSTANT(TEXTURE15); //33999
    _INSTALL_CONSTANT(TEXTURE16); //34000
    _INSTALL_CONSTANT(TEXTURE17); //34001
    _INSTALL_CONSTANT(TEXTURE18); //34002
    _INSTALL_CONSTANT(TEXTURE19); //34003
    _INSTALL_CONSTANT(TEXTURE20); //34004
    _INSTALL_CONSTANT(TEXTURE21); //34005
    _INSTALL_CONSTANT(TEXTURE22); //34006
    _INSTALL_CONSTANT(TEXTURE23); //34007
    _INSTALL_CONSTANT(TEXTURE24); //34008
    _INSTALL_CONSTANT(TEXTURE25); //34009
    _INSTALL_CONSTANT(TEXTURE26); //34010
    _INSTALL_CONSTANT(TEXTURE27); //34011
    _INSTALL_CONSTANT(TEXTURE28); //34012
    _INSTALL_CONSTANT(TEXTURE29); //34013
    _INSTALL_CONSTANT(TEXTURE30); //34014
    _INSTALL_CONSTANT(TEXTURE31); //34015
    _INSTALL_CONSTANT(TEXTURE_2D); //3553
    _INSTALL_CONSTANT(TEXTURE_2D_ARRAY); //35866
    _INSTALL_CONSTANT(TEXTURE_3D); //32879
    _INSTALL_CONSTANT(TEXTURE_BASE_LEVEL); //33084
    _INSTALL_CONSTANT(TEXTURE_BINDING_2D); //32873
    _INSTALL_CONSTANT(TEXTURE_BINDING_2D_ARRAY); //35869
    _INSTALL_CONSTANT(TEXTURE_BINDING_3D); //32874
    _INSTALL_CONSTANT(TEXTURE_BINDING_CUBE_MAP); //34068
    _INSTALL_CONSTANT(TEXTURE_COMPARE_FUNC); //34893
    _INSTALL_CONSTANT(TEXTURE_COMPARE_MODE); //34892
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP); //34067
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_X); //34070
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_Y); //34072
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_Z); //34074
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_X); //34069
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_Y); //34071
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_Z); //34073
    _INSTALL_CONSTANT(TEXTURE_IMMUTABLE_FORMAT); //37167
    _INSTALL_CONSTANT(TEXTURE_IMMUTABLE_LEVELS); //33503
    _INSTALL_CONSTANT(TEXTURE_MAG_FILTER); //10240
    _INSTALL_CONSTANT(TEXTURE_MAX_LEVEL); //33085
    _INSTALL_CONSTANT(TEXTURE_MAX_LOD); //33083
    _INSTALL_CONSTANT(TEXTURE_MIN_FILTER); //10241
    _INSTALL_CONSTANT(TEXTURE_MIN_LOD); //33082
    _INSTALL_CONSTANT(TEXTURE_WRAP_R); //32882
    _INSTALL_CONSTANT(TEXTURE_WRAP_S); //10242
    _INSTALL_CONSTANT(TEXTURE_WRAP_T); //10243
    _INSTALL_CONSTANT(TIMEOUT_EXPIRED); //37147
    _INSTALL_CONSTANT(TIMEOUT_IGNORED); //-1
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK); //36386
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_ACTIVE); //36388
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BINDING); //36389
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BUFFER); //35982
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BUFFER_BINDING); //35983
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BUFFER_MODE); //35967
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BUFFER_SIZE); //35973
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_BUFFER_START); //35972
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_PAUSED); //36387
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN); //35976
    _INSTALL_CONSTANT(TRANSFORM_FEEDBACK_VARYINGS); //35971
    _INSTALL_CONSTANT(TRIANGLES); //4
    _INSTALL_CONSTANT(TRIANGLE_FAN); //6
    _INSTALL_CONSTANT(TRIANGLE_STRIP); //5
    // _INSTALL_CONSTANT(TRUE); //1
    _INSTALL_CONSTANT(UNIFORM_ARRAY_STRIDE); //35388
    _INSTALL_CONSTANT(UNIFORM_BLOCK_ACTIVE_UNIFORMS); //35394
    _INSTALL_CONSTANT(UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES); //35395
    _INSTALL_CONSTANT(UNIFORM_BLOCK_BINDING); //35391
    _INSTALL_CONSTANT(UNIFORM_BLOCK_DATA_SIZE); //35392
    _INSTALL_CONSTANT(UNIFORM_BLOCK_INDEX); //35386
    _INSTALL_CONSTANT(UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER); //35397
    _INSTALL_CONSTANT(UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER); //35396
    _INSTALL_CONSTANT(UNIFORM_BUFFER); //35345
    _INSTALL_CONSTANT(UNIFORM_BUFFER_BINDING); //35368
    _INSTALL_CONSTANT(UNIFORM_BUFFER_OFFSET_ALIGNMENT); //35380
    _INSTALL_CONSTANT(UNIFORM_BUFFER_SIZE); //35370
    _INSTALL_CONSTANT(UNIFORM_BUFFER_START); //35369
    _INSTALL_CONSTANT(UNIFORM_IS_ROW_MAJOR); //35390
    _INSTALL_CONSTANT(UNIFORM_MATRIX_STRIDE); //35389
    _INSTALL_CONSTANT(UNIFORM_OFFSET); //35387
    _INSTALL_CONSTANT(UNIFORM_SIZE); //35384
    _INSTALL_CONSTANT(UNIFORM_TYPE); //35383
    _INSTALL_CONSTANT(UNPACK_ALIGNMENT); //3317
    _INSTALL_CONSTANT(UNPACK_COLORSPACE_CONVERSION_WEBGL); //37443
    _INSTALL_CONSTANT(UNPACK_FLIP_Y_WEBGL); //37440
    _INSTALL_CONSTANT(UNPACK_IMAGE_HEIGHT); //32878
    _INSTALL_CONSTANT(UNPACK_PREMULTIPLY_ALPHA_WEBGL); //37441
    _INSTALL_CONSTANT(UNPACK_ROW_LENGTH); //3314
    _INSTALL_CONSTANT(UNPACK_SKIP_IMAGES); //32877
    _INSTALL_CONSTANT(UNPACK_SKIP_PIXELS); //3316
    _INSTALL_CONSTANT(UNPACK_SKIP_ROWS); //3315
    _INSTALL_CONSTANT(UNSIGNALED); //37144
    _INSTALL_CONSTANT(UNSIGNED_BYTE); //5121
    _INSTALL_CONSTANT(UNSIGNED_INT); //5125
    _INSTALL_CONSTANT(UNSIGNED_INT_10F_11F_11F_REV); //35899
    _INSTALL_CONSTANT(UNSIGNED_INT_24_8); //34042
    _INSTALL_CONSTANT(UNSIGNED_INT_2_10_10_10_REV); //33640
    _INSTALL_CONSTANT(UNSIGNED_INT_5_9_9_9_REV); //35902
    _INSTALL_CONSTANT(UNSIGNED_INT_SAMPLER_2D); //36306
    _INSTALL_CONSTANT(UNSIGNED_INT_SAMPLER_2D_ARRAY); //36311
    _INSTALL_CONSTANT(UNSIGNED_INT_SAMPLER_3D); //36307
    _INSTALL_CONSTANT(UNSIGNED_INT_SAMPLER_CUBE); //36308
    _INSTALL_CONSTANT(UNSIGNED_INT_VEC2); //36294
    _INSTALL_CONSTANT(UNSIGNED_INT_VEC3); //36295
    _INSTALL_CONSTANT(UNSIGNED_INT_VEC4); //36296
    _INSTALL_CONSTANT(UNSIGNED_NORMALIZED); //35863
    _INSTALL_CONSTANT(UNSIGNED_SHORT); //5123
    _INSTALL_CONSTANT(UNSIGNED_SHORT_4_4_4_4); //32819
    _INSTALL_CONSTANT(UNSIGNED_SHORT_5_5_5_1); //32820
    _INSTALL_CONSTANT(UNSIGNED_SHORT_5_6_5); //33635
    _INSTALL_CONSTANT(VALIDATE_STATUS); //35715
    _INSTALL_CONSTANT(VENDOR); //7936
    _INSTALL_CONSTANT(VERSION); //7938
    _INSTALL_CONSTANT(VERTEX_ARRAY_BINDING); //34229
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_BUFFER_BINDING); //34975
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_DIVISOR); //35070
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_ENABLED); //34338
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_INTEGER); //35069
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_NORMALIZED); //34922
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_POINTER); //34373
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_SIZE); //34339
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_STRIDE); //34340
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_TYPE); //34341
    _INSTALL_CONSTANT(VERTEX_SHADER); //35633
    _INSTALL_CONSTANT(VIEWPORT); //2978
    _INSTALL_CONSTANT(WAIT_FAILED); //37149
    _INSTALL_CONSTANT(ZERO); //0

#undef _INSTALL_CONSTANT
  }
};

std::atomic_uint EXGLContext::nextObjectId { 1 };


// --- C interface -------------------------------------------------------------

static std::unordered_map<UEXGLContextId, EXGLContext *> EXGLContextMap;
static std::mutex EXGLContextMapMutex;
static UEXGLContextId EXGLContextNextId = 1;

static EXGLContext *EXGLContextGet(UEXGLContextId exglCtxId) {
  std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    return iter->second;
  }
  return nullptr;
}

UEXGLContextId UEXGLContextCreate(JSGlobalContextRef jsCtx) {
  // Out of ids?
  if (EXGLContextNextId >= std::numeric_limits<UEXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  // Create C++ object
  EXGLContext *exglCtx;
  UEXGLContextId exglCtxId;
  {
    std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);
    exglCtxId = EXGLContextNextId++;
    if (EXGLContextMap.find(exglCtxId) != EXGLContextMap.end()) {
      EXGLSysLog("Tried to reuse an EXGLContext id. This shouldn't really happen...");
      return 0;
    }
    exglCtx = new EXGLContext(jsCtx, exglCtxId);
    EXGLContextMap[exglCtxId] = exglCtx;
  }

  // Save JavaScript object
  auto jsGlobal = JSContextGetGlobalObject(jsCtx);
  auto jsEXGLContextMap = (JSObjectRef) EXJSObjectGetPropertyNamed(jsCtx, jsGlobal, "__EXGLContexts");
  if (!JSValueToBoolean(jsCtx, jsEXGLContextMap)) {
    jsEXGLContextMap = JSObjectMake(jsCtx, nullptr, nullptr);
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsGlobal, "__EXGLContexts", jsEXGLContextMap);
  }
  std::stringstream ss;
  ss << exglCtxId;
  auto exglCtxIdStr = ss.str();
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsEXGLContextMap,
                                        exglCtxIdStr.c_str(), exglCtx->getJSObject());

  return exglCtxId;
}

void UEXGLContextSetFlushMethod(UEXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flushOnGLThread = flushMethod;
  }
}
  
#ifdef __APPLE__
void UEXGLContextSetFlushMethodObjc(UEXGLContextId exglCtxId, UEXGLFlushMethodBlock flushMethod) {
  UEXGLContextSetFlushMethod(exglCtxId, [flushMethod] {
    flushMethod();
  });
}
#endif

bool UEXGLContextNeedsRedraw(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void UEXGLContextDrawEnded(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setNeedsRedraw(false);
  }
}

void UEXGLContextDestroy(UEXGLContextId exglCtxId) {
  std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);

  // Destroy C++ object, JavaScript side should just know...
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    delete iter->second;
    EXGLContextMap.erase(iter);
  }
}

void UEXGLContextFlush(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void UEXGLContextSetDefaultFramebuffer(UEXGLContextId exglCtxId, GLint framebuffer) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setDefaultFramebuffer(framebuffer);
  }
}


UEXGLObjectId UEXGLContextCreateObject(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void UEXGLContextDestroyObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void UEXGLContextMapObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint UEXGLContextGetObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
