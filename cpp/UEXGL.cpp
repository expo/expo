#include "UEXGL.h"

#ifdef __ANDROID__
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <android/log.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
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
      cv.wait(lock, [&] { return done; });
    }
#else
    std::packaged_task<decltype(f())(void)> task(std::move(f));
    auto future = task.get_future();
    addToNextBatch([&] { task(); });
    endNextBatch();
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

  // [GL thread] Do all the remaining work we can do on the GL thread
public:
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

  inline GLuint lookupObject(UEXGLObjectId exglObjId) noexcept {
    auto iter = objects.find(exglObjId);
    return iter == objects.end() ? 0 : iter->second;
  }

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


  // --- Init/destroy and JS object binding ------------------------------------
private:
  JSObjectRef jsGl;

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
      glBindFramebuffer(GL_FRAMEBUFFER, defaultFramebuffer);
      glClearColor(0, 0, 0, 0);
      glClearDepthf(1);
      glClearStencil(0);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
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
  void setDefaultFramebuffer(GLint framebuffer) {
    defaultFramebuffer = framebuffer;
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
      case GL_HALF_FLOAT_OES:
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
      JSObjectRef jsObject = (JSObjectRef) jsVal;

      size_t byteLength = JSObjectGetTypedArrayByteLength(jsCtx, jsObject, nullptr);
      if (pByteLength) {
        *pByteLength = byteLength;
      }

      void *data = JSObjectGetTypedArrayBytesPtr(jsCtx, jsObject, nullptr);
      if (!data) {
        return std::shared_ptr<void>(nullptr);
      }

      // Copy data since it's unclear how long JavaScriptCore's buffer will live
      // TODO(nikki): See if we can just pin/unpin and not copy?
      void *dataMalloc = malloc(byteLength);
      memcpy(dataMalloc, data, byteLength);
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
#define _WRAP_METHOD(name, minArgc)                                     \
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

  // Wrapper raises an exception saying the function isn't implemented yet
#define _WRAP_METHOD_UNIMPL(name)                                       \
  _WRAP_METHOD(name, 0) {                                               \
    throw std::runtime_error("EXGL: " #name "() isn't implemented yet!"); \
    return nullptr;                                                     \
  }

  // Wrapper that takes only scalar arguments and returns nothing
#define _WRAP_METHOD_SIMPLE(name, glFunc, ...)                          \
  _WRAP_METHOD(name, EXJS_ARGC(__VA_ARGS__)) {                          \
    addToNextBatch(std::bind(glFunc, EXJS_MAP_EXT(0, _EXJS_COMMA, _WRAP_METHOD_SIMPLE_UNPACK, __VA_ARGS__))); \
    return nullptr;                                                     \
  }
#define _WRAP_METHOD_SIMPLE_UNPACK(i, _) EXJSValueToNumberFast(jsCtx, jsArgv[i])


  // This listing follows the order in
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext


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
      case GL_SAMPLE_COVERAGE_VALUE: {
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
        _GET_PARAMETER_UNIMPL(FRAMEBUFFER_BINDING);
        _GET_PARAMETER_UNIMPL(RENDERBUFFER_BINDING);
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_2D);
        _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_CUBE_MAP);
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

#define _WRAP_METHOD_IS_OBJECT(type)              \
  _WRAP_METHOD(is ## type, 1) {                   \
    EXJS_UNPACK_ARGV(UEXGLObjectId f);             \
    GLboolean glResult;                           \
    addBlockingToNextBatch([&] {                  \
      glResult = glIs ## type(lookupObject(f));   \
    });                                           \
    return JSValueMakeBoolean(jsCtx, glResult);   \
  }

  _WRAP_METHOD_IS_OBJECT(Buffer)


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

  _WRAP_METHOD(texImage2D, 6) {
    if (jsArgc == 9) {
      // 9-argument version
      EXJS_UNPACK_ARGV(GLenum target, GLint level, GLint internalformat,
                       GLsizei width, GLsizei height, GLsizei border,
                       GLenum format, GLenum type);
      // Null?
      if (JSValueIsNull(jsCtx, jsArgv[8])) {
        addToNextBatch([=] {
          glTexImage2D(target, level, internalformat,
                       width, height, border,
                       format, type, nullptr);
        });
        return nullptr;
      }

      JSObjectRef jsPixels = (JSObjectRef) jsArgv[8];

      // Raw texture data TypedArray?
      {
        auto data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
        if (data) {
          if (unpackFLipY) {
            flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
          }
          addToNextBatch([=] {
            glTexImage2D(target, level, internalformat,
                         width, height, border,
                         format, type, data.get());
          });
          return nullptr;
        }
      }

      // Exponent.Asset object?
      JSValueRef jsLocalUri = EXJSObjectGetPropertyNamed(jsCtx, jsPixels, "localUri");
      if (jsLocalUri && JSValueIsString(jsCtx, jsLocalUri)) {
        // TODO(nikki): Check that this file is in the right scope
        auto localUri = jsValueToSharedStr(jsCtx, jsLocalUri);
        if (strncmp(localUri.get(), "file://", 7) != 0) {
          throw std::runtime_error("EXGL: Asset doesn't have a cached local file for"
                                   " gl.texImage2D()!");
        }
        char localPath[strlen(localUri.get())];
        decodeURI(localPath, localUri.get() + 7);

        int fileWidth, fileHeight, fileComp;
        std::shared_ptr<void> data(stbi_load(localPath, &fileWidth, &fileHeight,
                                             &fileComp, STBI_rgb_alpha),
                                   stbi_image_free);
        if (!data) {
          throw std::runtime_error("EXGL: Couldn't read image from Asset's local file"
                                   " for gl.texImage2D()!");
        }
        if (width != fileWidth || height != fileHeight) {
          throw std::runtime_error("EXGL: Asset's width and height don't match"
                                   " given width and height for gl.texImage2D()!");
        }
        if (unpackFLipY) {
          flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
        }
        addToNextBatch([=] {
          glTexImage2D(target, level, internalformat,
                       width, height, border,
                       format, type, data.get());
        });
        return nullptr;
      }

      // None of the above?
      throw std::runtime_error("EXGL: Invalid pixel data argument for"
                               " gl.texImage2D()!");
    } else if (jsArgc == 6) {
      // 6-argument version (no width, height, border)
      throw std::runtime_error("EXGL: gl.texImage2D() doesn't support 6-argument"
                               " version yet!");
    } else {
      throw std::runtime_error("EXGL: Invalid number of arguments to gl.texImage2D()!");
    }
  }

  _WRAP_METHOD_UNIMPL(texSubImage2D)

  _WRAP_METHOD_SIMPLE(texParameterf, glTexParameterf, target, pname, param)

  _WRAP_METHOD_SIMPLE(texParameteri, glTexParameteri, target, pname, param)


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
#undef _WRAP_METHOD_UNIFORM_V

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
#undef _WRAP_METHOD_UNIFORM_MATRIX

#define _WRAP_METHOD_VERTEX_ATTRIB_V(suffix, dim)                       \
  _WRAP_METHOD(vertexAttrib##suffix, 2) {                               \
    GLuint index = EXJSValueToNumberFast(jsCtx, jsArgv[0]);             \
    auto data = jsValueToSharedArray(jsCtx, jsArgv[1], nullptr);        \
    addToNextBatch([=] { glVertexAttrib##suffix(index, (GLfloat *) data.get());}); \
    return nullptr;                                                     \
  }
  _WRAP_METHOD_VERTEX_ATTRIB_V(1fv, 1)
  _WRAP_METHOD_VERTEX_ATTRIB_V(2fv, 1)
  _WRAP_METHOD_VERTEX_ATTRIB_V(3fv, 1)
  _WRAP_METHOD_VERTEX_ATTRIB_V(4fv, 1)
#undef _WRAP_METHOD_VERTEX_ATTRIB_V

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
    endNextBatch();
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

    // Renderbuffers
    _INSTALL_METHOD(bindRenderbuffer);
    _INSTALL_METHOD(createRenderbuffer);
    _INSTALL_METHOD(deleteRenderbuffer);
    _INSTALL_METHOD(getRenderbufferParameter);
    _INSTALL_METHOD(isRenderbuffer);
    _INSTALL_METHOD(renderbufferStorage);

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

    // Drawing buffers
    _INSTALL_METHOD(clear);
    _INSTALL_METHOD(drawArrays);
    _INSTALL_METHOD(drawElements);
    _INSTALL_METHOD(finish);
    _INSTALL_METHOD(flush);

    // Extensions
    _INSTALL_METHOD(getSupportedExtensions);
    _INSTALL_METHOD(getExtension);

    // Exponent extensions
    _INSTALL_METHOD(endFrameEXP);

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
    // _INSTALL_CONSTANT(ACTIVE_UNIFORM_MAX_LENGTH); //35719
    _INSTALL_CONSTANT(ALIASED_LINE_WIDTH_RANGE); //33902
    _INSTALL_CONSTANT(ALIASED_POINT_SIZE_RANGE); //33901
    _INSTALL_CONSTANT(ALPHA); //6406
    _INSTALL_CONSTANT(ALPHA_BITS); //3413
    _INSTALL_CONSTANT(ALWAYS); //519
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
    _INSTALL_CONSTANT(COLOR_ATTACHMENT0); //36064
    _INSTALL_CONSTANT(COLOR_BUFFER_BIT); //16384
    _INSTALL_CONSTANT(COLOR_CLEAR_VALUE); //3106
    _INSTALL_CONSTANT(COLOR_WRITEMASK); //3107
    _INSTALL_CONSTANT(COMPILE_STATUS); //35713
    _INSTALL_CONSTANT(COMPRESSED_TEXTURE_FORMATS); //34467
    _INSTALL_CONSTANT(CONSTANT_ALPHA); //32771
    _INSTALL_CONSTANT(CONSTANT_COLOR); //32769
    _INSTALL_CONSTANT(CONTEXT_LOST_WEBGL); //37442
    _INSTALL_CONSTANT(CULL_FACE); //2884
    _INSTALL_CONSTANT(CULL_FACE_MODE); //2885
    _INSTALL_CONSTANT(CURRENT_PROGRAM); //35725
    _INSTALL_CONSTANT(CURRENT_VERTEX_ATTRIB); //34342
    _INSTALL_CONSTANT(CW); //2304
    _INSTALL_CONSTANT(DECR); //7683
    _INSTALL_CONSTANT(DECR_WRAP); //34056
    _INSTALL_CONSTANT(DELETE_STATUS); //35712
    _INSTALL_CONSTANT(DEPTH_ATTACHMENT); //36096
    _INSTALL_CONSTANT(DEPTH_BITS); //3414
    _INSTALL_CONSTANT(DEPTH_BUFFER_BIT); //256
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
    _INSTALL_CONSTANT(DST_ALPHA); //772
    _INSTALL_CONSTANT(DST_COLOR); //774
    _INSTALL_CONSTANT(DYNAMIC_DRAW); //35048
    _INSTALL_CONSTANT(ELEMENT_ARRAY_BUFFER); //34963
    _INSTALL_CONSTANT(ELEMENT_ARRAY_BUFFER_BINDING); //34965
    _INSTALL_CONSTANT(EQUAL); //514
    // _INSTALL_CONSTANT(FALSE); //0
    _INSTALL_CONSTANT(FASTEST); //4353
    _INSTALL_CONSTANT(FLOAT); //5126
    _INSTALL_CONSTANT(FLOAT_MAT2); //35674
    _INSTALL_CONSTANT(FLOAT_MAT3); //35675
    _INSTALL_CONSTANT(FLOAT_MAT4); //35676
    _INSTALL_CONSTANT(FLOAT_VEC2); //35664
    _INSTALL_CONSTANT(FLOAT_VEC3); //35665
    _INSTALL_CONSTANT(FLOAT_VEC4); //35666
    _INSTALL_CONSTANT(FRAGMENT_SHADER); //35632
    _INSTALL_CONSTANT(FRAMEBUFFER); //36160
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_OBJECT_NAME); //36049
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE); //36048
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE); //36051
    _INSTALL_CONSTANT(FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL); //36050
    _INSTALL_CONSTANT(FRAMEBUFFER_BINDING); //36006
    _INSTALL_CONSTANT(FRAMEBUFFER_COMPLETE); //36053
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_ATTACHMENT); //36054
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_DIMENSIONS); //36057
    _INSTALL_CONSTANT(FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT); //36055
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
    _INSTALL_CONSTANT(HIGH_FLOAT); //36338
    _INSTALL_CONSTANT(HIGH_INT); //36341
    _INSTALL_CONSTANT(IMPLEMENTATION_COLOR_READ_TYPE); //35738
    _INSTALL_CONSTANT(IMPLEMENTATION_COLOR_READ_FORMAT); //35739
    _INSTALL_CONSTANT(INCR); //7682
    _INSTALL_CONSTANT(INCR_WRAP); //34055
    // _INSTALL_CONSTANT(INFO_LOG_LENGTH); //35716
    _INSTALL_CONSTANT(INT); //5124
    _INSTALL_CONSTANT(INT_VEC2); //35667
    _INSTALL_CONSTANT(INT_VEC3); //35668
    _INSTALL_CONSTANT(INT_VEC4); //35669
    _INSTALL_CONSTANT(INVALID_ENUM); //1280
    _INSTALL_CONSTANT(INVALID_FRAMEBUFFER_OPERATION); //1286
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
    _INSTALL_CONSTANT(MAX_COMBINED_TEXTURE_IMAGE_UNITS); //35661
    _INSTALL_CONSTANT(MAX_CUBE_MAP_TEXTURE_SIZE); //34076
    _INSTALL_CONSTANT(MAX_FRAGMENT_UNIFORM_VECTORS); //36349
    _INSTALL_CONSTANT(MAX_RENDERBUFFER_SIZE); //34024
    _INSTALL_CONSTANT(MAX_TEXTURE_IMAGE_UNITS); //34930
    _INSTALL_CONSTANT(MAX_TEXTURE_SIZE); //3379
    _INSTALL_CONSTANT(MAX_VARYING_VECTORS); //36348
    _INSTALL_CONSTANT(MAX_VERTEX_ATTRIBS); //34921
    _INSTALL_CONSTANT(MAX_VERTEX_TEXTURE_IMAGE_UNITS); //35660
    _INSTALL_CONSTANT(MAX_VERTEX_UNIFORM_VECTORS); //36347
    _INSTALL_CONSTANT(MAX_VIEWPORT_DIMS); //3386
    _INSTALL_CONSTANT(MEDIUM_FLOAT); //36337
    _INSTALL_CONSTANT(MEDIUM_INT); //36340
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
    _INSTALL_CONSTANT(ONE); //1
    _INSTALL_CONSTANT(ONE_MINUS_CONSTANT_ALPHA); //32772
    _INSTALL_CONSTANT(ONE_MINUS_CONSTANT_COLOR); //32770
    _INSTALL_CONSTANT(ONE_MINUS_DST_ALPHA); //773
    _INSTALL_CONSTANT(ONE_MINUS_DST_COLOR); //775
    _INSTALL_CONSTANT(ONE_MINUS_SRC_ALPHA); //771
    _INSTALL_CONSTANT(ONE_MINUS_SRC_COLOR); //769
    _INSTALL_CONSTANT(OUT_OF_MEMORY); //1285
    _INSTALL_CONSTANT(PACK_ALIGNMENT); //3333
    _INSTALL_CONSTANT(POINTS); //0
    _INSTALL_CONSTANT(POLYGON_OFFSET_FACTOR); //32824
    _INSTALL_CONSTANT(POLYGON_OFFSET_FILL); //32823
    _INSTALL_CONSTANT(POLYGON_OFFSET_UNITS); //10752
    _INSTALL_CONSTANT(RED_BITS); //3410
    _INSTALL_CONSTANT(RENDERBUFFER); //36161
    _INSTALL_CONSTANT(RENDERBUFFER_ALPHA_SIZE); //36179
    _INSTALL_CONSTANT(RENDERBUFFER_BINDING); //36007
    _INSTALL_CONSTANT(RENDERBUFFER_BLUE_SIZE); //36178
    _INSTALL_CONSTANT(RENDERBUFFER_DEPTH_SIZE); //36180
    _INSTALL_CONSTANT(RENDERBUFFER_GREEN_SIZE); //36177
    _INSTALL_CONSTANT(RENDERBUFFER_HEIGHT); //36163
    _INSTALL_CONSTANT(RENDERBUFFER_INTERNAL_FORMAT); //36164
    _INSTALL_CONSTANT(RENDERBUFFER_RED_SIZE); //36176
    _INSTALL_CONSTANT(RENDERBUFFER_STENCIL_SIZE); //36181
    _INSTALL_CONSTANT(RENDERBUFFER_WIDTH); //36162
    _INSTALL_CONSTANT(RENDERER); //7937
    _INSTALL_CONSTANT(REPEAT); //10497
    _INSTALL_CONSTANT(REPLACE); //7681
    _INSTALL_CONSTANT(RGB); //6407
    _INSTALL_CONSTANT(RGB5_A1); //32855
    _INSTALL_CONSTANT(RGB565); //36194
    _INSTALL_CONSTANT(RGBA); //6408
    _INSTALL_CONSTANT(RGBA4); //32854
    _INSTALL_CONSTANT(SAMPLER_2D); //35678
    _INSTALL_CONSTANT(SAMPLER_CUBE); //35680
    _INSTALL_CONSTANT(SAMPLES); //32937
    _INSTALL_CONSTANT(SAMPLE_ALPHA_TO_COVERAGE); //32926
    _INSTALL_CONSTANT(SAMPLE_BUFFERS); //32936
    _INSTALL_CONSTANT(SAMPLE_COVERAGE); //32928
    _INSTALL_CONSTANT(SAMPLE_COVERAGE_INVERT); //32939
    _INSTALL_CONSTANT(SAMPLE_COVERAGE_VALUE); //32938
    _INSTALL_CONSTANT(SCISSOR_BOX); //3088
    _INSTALL_CONSTANT(SCISSOR_TEST); //3089
    // _INSTALL_CONSTANT(SHADER_COMPILER); //36346
    // _INSTALL_CONSTANT(SHADER_SOURCE_LENGTH); //35720
    _INSTALL_CONSTANT(SHADER_TYPE); //35663
    _INSTALL_CONSTANT(SHADING_LANGUAGE_VERSION); //35724
    _INSTALL_CONSTANT(SHORT); //5122
    _INSTALL_CONSTANT(SRC_ALPHA); //770
    _INSTALL_CONSTANT(SRC_ALPHA_SATURATE); //776
    _INSTALL_CONSTANT(SRC_COLOR); //768
    _INSTALL_CONSTANT(STATIC_DRAW); //35044
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
    _INSTALL_CONSTANT(STREAM_DRAW); //35040
    _INSTALL_CONSTANT(SUBPIXEL_BITS); //3408
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
    _INSTALL_CONSTANT(TEXTURE_BINDING_2D); //32873
    _INSTALL_CONSTANT(TEXTURE_BINDING_CUBE_MAP); //34068
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP); //34067
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_X); //34070
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_Y); //34072
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_NEGATIVE_Z); //34074
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_X); //34069
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_Y); //34071
    _INSTALL_CONSTANT(TEXTURE_CUBE_MAP_POSITIVE_Z); //34073
    _INSTALL_CONSTANT(TEXTURE_MAG_FILTER); //10240
    _INSTALL_CONSTANT(TEXTURE_MIN_FILTER); //10241
    _INSTALL_CONSTANT(TEXTURE_WRAP_S); //10242
    _INSTALL_CONSTANT(TEXTURE_WRAP_T); //10243
    _INSTALL_CONSTANT(TRIANGLES); //4
    _INSTALL_CONSTANT(TRIANGLE_FAN); //6
    _INSTALL_CONSTANT(TRIANGLE_STRIP); //5
    // _INSTALL_CONSTANT(TRUE); //1
    _INSTALL_CONSTANT(UNPACK_ALIGNMENT); //3317
    _INSTALL_CONSTANT(UNPACK_COLORSPACE_CONVERSION_WEBGL); //37443
    _INSTALL_CONSTANT(UNPACK_FLIP_Y_WEBGL); //37440
    _INSTALL_CONSTANT(UNPACK_PREMULTIPLY_ALPHA_WEBGL); //37441
    _INSTALL_CONSTANT(UNSIGNED_BYTE); //5121
    _INSTALL_CONSTANT(UNSIGNED_INT); //5125
    _INSTALL_CONSTANT(UNSIGNED_SHORT); //5123
    _INSTALL_CONSTANT(UNSIGNED_SHORT_4_4_4_4); //32819
    _INSTALL_CONSTANT(UNSIGNED_SHORT_5_5_5_1); //32820
    _INSTALL_CONSTANT(UNSIGNED_SHORT_5_6_5); //33635
    _INSTALL_CONSTANT(VALIDATE_STATUS); //35715
    _INSTALL_CONSTANT(VENDOR); //7936
    _INSTALL_CONSTANT(VERSION); //7938
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_BUFFER_BINDING); //34975
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_ENABLED); //34338
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_NORMALIZED); //34922
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_POINTER); //34373
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_SIZE); //34339
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_STRIDE); //34340
    _INSTALL_CONSTANT(VERTEX_ATTRIB_ARRAY_TYPE); //34341
    _INSTALL_CONSTANT(VERTEX_SHADER); //35633
    _INSTALL_CONSTANT(VIEWPORT); //2978
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
