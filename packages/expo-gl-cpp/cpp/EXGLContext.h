#include "UEXGL.h"
#include "EXJSUtils.h"
#include "EXJSConvertTypedArray.h"

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#include <OpenGLES/EAGL.h>
#endif

#include <future>
#include <unordered_map>
#include <exception>
#include <sstream>
#include <vector>

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

  static EXGLContext* ContextGet(UEXGLContextId exglCtxId);
  static UEXGLContextId ContextCreate(JSGlobalContextRef jsCtx);
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
  void installMethods(JSContextRef jsCtx);
  void installConstants(JSContextRef jsCtx);

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

  // Load image data from an object with a `.localUri` member
  std::shared_ptr<void> loadImage(JSContextRef jsCtx, JSObjectRef jsPixels,
                                  int *fileWidth, int *fileHeight, int *fileComp);

  void decodeURI(char *dst, const char *src) {
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


  template<typename T, size_t dim, typename F>
  inline JSValueRef getParameterArray(JSContextRef jsCtx, JSTypedArrayType arrayType,
                                      F &&glGetFunc, GLenum pname) {
    T glResults[dim];
    addBlockingToNextBatch([&] { glGetFunc(pname, glResults); });
    return makeTypedArray(jsCtx, arrayType, glResults, sizeof(glResults));
  }

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



// Standard method wrapper, run on JS thread, return a value
#define _WRAP_METHOD_DECLARATIONS(name)                                                                 \
  static JSValueRef exglNativeStatic_##name(JSContextRef jsCtx,                                         \
                                            JSObjectRef jsFunction,                                     \
                                            JSObjectRef jsThis,                                         \
                                            size_t jsArgc,                                              \
                                            const JSValueRef jsArgv[],                                  \
                                            JSValueRef* jsException);                                   \
  JSValueRef exglNativeInstance_##name(JSContextRef jsCtx,                                              \
                                              JSObjectRef jsFunction,                                   \
                                              JSObjectRef jsThis,                                       \
                                              size_t jsArgc,                                            \
                                              const JSValueRef jsArgv[],                                \
                                              JSValueRef* jsException)

  // This listing follows the order in
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext

  // The WebGL context
  _WRAP_METHOD_DECLARATIONS(getContextAttributes);
  _WRAP_METHOD_DECLARATIONS(isContextLost);

  // Viewing and clipping
  _WRAP_METHOD_DECLARATIONS(scissor);
  _WRAP_METHOD_DECLARATIONS(viewport);

  // State information
  _WRAP_METHOD_DECLARATIONS(activeTexture);
  _WRAP_METHOD_DECLARATIONS(blendColor);
  _WRAP_METHOD_DECLARATIONS(blendEquation);
  _WRAP_METHOD_DECLARATIONS(blendEquationSeparate);
  _WRAP_METHOD_DECLARATIONS(blendFunc);
  _WRAP_METHOD_DECLARATIONS(blendFuncSeparate);
  _WRAP_METHOD_DECLARATIONS(clearColor);
  _WRAP_METHOD_DECLARATIONS(clearDepth);
  _WRAP_METHOD_DECLARATIONS(clearStencil);
  _WRAP_METHOD_DECLARATIONS(colorMask);
  _WRAP_METHOD_DECLARATIONS(cullFace);
  _WRAP_METHOD_DECLARATIONS(depthFunc);
  _WRAP_METHOD_DECLARATIONS(depthMask);
  _WRAP_METHOD_DECLARATIONS(depthRange);
  _WRAP_METHOD_DECLARATIONS(disable);
  _WRAP_METHOD_DECLARATIONS(enable);
  _WRAP_METHOD_DECLARATIONS(frontFace);
  _WRAP_METHOD_DECLARATIONS(getParameter);
  _WRAP_METHOD_DECLARATIONS(getError);
  _WRAP_METHOD_DECLARATIONS(hint);
  _WRAP_METHOD_DECLARATIONS(isEnabled);
  _WRAP_METHOD_DECLARATIONS(lineWidth);
  _WRAP_METHOD_DECLARATIONS(pixelStorei);
  _WRAP_METHOD_DECLARATIONS(polygonOffset);
  _WRAP_METHOD_DECLARATIONS(sampleCoverage);
  _WRAP_METHOD_DECLARATIONS(stencilFunc);
  _WRAP_METHOD_DECLARATIONS(stencilFuncSeparate);
  _WRAP_METHOD_DECLARATIONS(stencilMask);
  _WRAP_METHOD_DECLARATIONS(stencilMaskSeparate);
  _WRAP_METHOD_DECLARATIONS(stencilOp);
  _WRAP_METHOD_DECLARATIONS(stencilOpSeparate);

  // Buffers
  _WRAP_METHOD_DECLARATIONS(bindBuffer);
  _WRAP_METHOD_DECLARATIONS(bufferData);
  _WRAP_METHOD_DECLARATIONS(bufferSubData);
  _WRAP_METHOD_DECLARATIONS(createBuffer);
  _WRAP_METHOD_DECLARATIONS(deleteBuffer);
  _WRAP_METHOD_DECLARATIONS(getBufferParameter);
  _WRAP_METHOD_DECLARATIONS(isBuffer);

  // Buffers (WebGL2)
  _WRAP_METHOD_DECLARATIONS(copyBufferSubData);
  _WRAP_METHOD_DECLARATIONS(getBufferSubData);

  // Framebuffers
  _WRAP_METHOD_DECLARATIONS(bindFramebuffer);
  _WRAP_METHOD_DECLARATIONS(checkFramebufferStatus);
  _WRAP_METHOD_DECLARATIONS(createFramebuffer);
  _WRAP_METHOD_DECLARATIONS(deleteFramebuffer);
  _WRAP_METHOD_DECLARATIONS(framebufferRenderbuffer);
  _WRAP_METHOD_DECLARATIONS(framebufferTexture2D);
  _WRAP_METHOD_DECLARATIONS(getFramebufferAttachmentParameter);
  _WRAP_METHOD_DECLARATIONS(isFramebuffer);
  _WRAP_METHOD_DECLARATIONS(readPixels);

  // Framebuffers (WebGL2)
  _WRAP_METHOD_DECLARATIONS(blitFramebuffer);
  _WRAP_METHOD_DECLARATIONS(framebufferTextureLayer);
  _WRAP_METHOD_DECLARATIONS(invalidateFramebuffer);
  _WRAP_METHOD_DECLARATIONS(invalidateSubFramebuffer);
  _WRAP_METHOD_DECLARATIONS(readBuffer);

  // Renderbuffers
  _WRAP_METHOD_DECLARATIONS(bindRenderbuffer);
  _WRAP_METHOD_DECLARATIONS(createRenderbuffer);
  _WRAP_METHOD_DECLARATIONS(deleteRenderbuffer);
  _WRAP_METHOD_DECLARATIONS(getRenderbufferParameter);
  _WRAP_METHOD_DECLARATIONS(isRenderbuffer);
  _WRAP_METHOD_DECLARATIONS(renderbufferStorage);

  // Renderbuffers (WebGL2)
  _WRAP_METHOD_DECLARATIONS(getInternalformatParameter);
  _WRAP_METHOD_DECLARATIONS(renderbufferStorageMultisample);

  // Textures
  _WRAP_METHOD_DECLARATIONS(bindTexture);
  _WRAP_METHOD_DECLARATIONS(compressedTexImage2D);
  _WRAP_METHOD_DECLARATIONS(compressedTexSubImage2D);
  _WRAP_METHOD_DECLARATIONS(copyTexImage2D);
  _WRAP_METHOD_DECLARATIONS(copyTexSubImage2D);
  _WRAP_METHOD_DECLARATIONS(createTexture);
  _WRAP_METHOD_DECLARATIONS(deleteTexture);
  _WRAP_METHOD_DECLARATIONS(generateMipmap);
  _WRAP_METHOD_DECLARATIONS(getTexParameter);
  _WRAP_METHOD_DECLARATIONS(isTexture);
  _WRAP_METHOD_DECLARATIONS(texImage2D);
  _WRAP_METHOD_DECLARATIONS(texSubImage2D);
  _WRAP_METHOD_DECLARATIONS(texParameterf);
  _WRAP_METHOD_DECLARATIONS(texParameteri);

  // Textures (WebGL2)
  _WRAP_METHOD_DECLARATIONS(texStorage2D);
  _WRAP_METHOD_DECLARATIONS(texStorage3D);
  _WRAP_METHOD_DECLARATIONS(texImage3D);
  _WRAP_METHOD_DECLARATIONS(texSubImage3D);
  _WRAP_METHOD_DECLARATIONS(copyTexSubImage3D);
  _WRAP_METHOD_DECLARATIONS(compressedTexImage3D);
  _WRAP_METHOD_DECLARATIONS(compressedTexSubImage3D);

  // Programs and shaders
  _WRAP_METHOD_DECLARATIONS(attachShader);
  _WRAP_METHOD_DECLARATIONS(bindAttribLocation);
  _WRAP_METHOD_DECLARATIONS(compileShader);
  _WRAP_METHOD_DECLARATIONS(createProgram);
  _WRAP_METHOD_DECLARATIONS(createShader);
  _WRAP_METHOD_DECLARATIONS(deleteProgram);
  _WRAP_METHOD_DECLARATIONS(deleteShader);
  _WRAP_METHOD_DECLARATIONS(detachShader);
  _WRAP_METHOD_DECLARATIONS(getAttachedShaders);
  _WRAP_METHOD_DECLARATIONS(getProgramParameter);
  _WRAP_METHOD_DECLARATIONS(getProgramInfoLog);
  _WRAP_METHOD_DECLARATIONS(getShaderParameter);
  _WRAP_METHOD_DECLARATIONS(getShaderPrecisionFormat);
  _WRAP_METHOD_DECLARATIONS(getShaderInfoLog);
  _WRAP_METHOD_DECLARATIONS(getShaderSource);
  _WRAP_METHOD_DECLARATIONS(isProgram);
  _WRAP_METHOD_DECLARATIONS(isShader);
  _WRAP_METHOD_DECLARATIONS(linkProgram);
  _WRAP_METHOD_DECLARATIONS(shaderSource);
  _WRAP_METHOD_DECLARATIONS(useProgram);
  _WRAP_METHOD_DECLARATIONS(validateProgram);

  // Programs and shaders (WebGL2)
  _WRAP_METHOD_DECLARATIONS(getFragDataLocation);

  // Uniforms and attributes
  _WRAP_METHOD_DECLARATIONS(disableVertexAttribArray);
  _WRAP_METHOD_DECLARATIONS(enableVertexAttribArray);
  _WRAP_METHOD_DECLARATIONS(getActiveAttrib);
  _WRAP_METHOD_DECLARATIONS(getActiveUniform);
  _WRAP_METHOD_DECLARATIONS(getAttribLocation);
  _WRAP_METHOD_DECLARATIONS(getUniform);
  _WRAP_METHOD_DECLARATIONS(getUniformLocation);
  _WRAP_METHOD_DECLARATIONS(getVertexAttrib);
  _WRAP_METHOD_DECLARATIONS(getVertexAttribOffset);
  _WRAP_METHOD_DECLARATIONS(uniform1f);
  _WRAP_METHOD_DECLARATIONS(uniform1fv);
  _WRAP_METHOD_DECLARATIONS(uniform1i);
  _WRAP_METHOD_DECLARATIONS(uniform1iv);
  _WRAP_METHOD_DECLARATIONS(uniform2f);
  _WRAP_METHOD_DECLARATIONS(uniform2fv);
  _WRAP_METHOD_DECLARATIONS(uniform2i);
  _WRAP_METHOD_DECLARATIONS(uniform2iv);
  _WRAP_METHOD_DECLARATIONS(uniform3f);
  _WRAP_METHOD_DECLARATIONS(uniform3fv);
  _WRAP_METHOD_DECLARATIONS(uniform3i);
  _WRAP_METHOD_DECLARATIONS(uniform3iv);
  _WRAP_METHOD_DECLARATIONS(uniform4f);
  _WRAP_METHOD_DECLARATIONS(uniform4fv);
  _WRAP_METHOD_DECLARATIONS(uniform4i);
  _WRAP_METHOD_DECLARATIONS(uniform4iv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix2fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix3fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix4fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib1f);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib1fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib2f);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib2fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib3f);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib3fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib4f);
  _WRAP_METHOD_DECLARATIONS(vertexAttrib4fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttribPointer);

  // Uniforms and attributes (WebGL2)
  _WRAP_METHOD_DECLARATIONS(uniform1ui);
  _WRAP_METHOD_DECLARATIONS(uniform2ui);
  _WRAP_METHOD_DECLARATIONS(uniform3ui);
  _WRAP_METHOD_DECLARATIONS(uniform4ui);
  _WRAP_METHOD_DECLARATIONS(uniform1uiv);
  _WRAP_METHOD_DECLARATIONS(uniform2uiv);
  _WRAP_METHOD_DECLARATIONS(uniform3uiv);
  _WRAP_METHOD_DECLARATIONS(uniform4uiv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix3x2fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix4x2fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix2x3fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix4x3fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix2x4fv);
  _WRAP_METHOD_DECLARATIONS(uniformMatrix3x4fv);
  _WRAP_METHOD_DECLARATIONS(vertexAttribI4i);
  _WRAP_METHOD_DECLARATIONS(vertexAttribI4ui);
  _WRAP_METHOD_DECLARATIONS(vertexAttribI4iv);
  _WRAP_METHOD_DECLARATIONS(vertexAttribI4uiv);
  _WRAP_METHOD_DECLARATIONS(vertexAttribIPointer);

  // Drawing buffers
  _WRAP_METHOD_DECLARATIONS(clear);
  _WRAP_METHOD_DECLARATIONS(drawArrays);
  _WRAP_METHOD_DECLARATIONS(drawElements);
  _WRAP_METHOD_DECLARATIONS(finish);
  _WRAP_METHOD_DECLARATIONS(flush);

  // Drawing buffers (WebGL2)
  _WRAP_METHOD_DECLARATIONS(vertexAttribDivisor);
  _WRAP_METHOD_DECLARATIONS(drawArraysInstanced);
  _WRAP_METHOD_DECLARATIONS(drawElementsInstanced);
  _WRAP_METHOD_DECLARATIONS(drawRangeElements);
  _WRAP_METHOD_DECLARATIONS(drawBuffers);
  _WRAP_METHOD_DECLARATIONS(clearBufferfv);
  _WRAP_METHOD_DECLARATIONS(clearBufferiv);
  _WRAP_METHOD_DECLARATIONS(clearBufferuiv);
  _WRAP_METHOD_DECLARATIONS(clearBufferfi);

  // Query objects (WebGL2)
  _WRAP_METHOD_DECLARATIONS(createQuery);
  _WRAP_METHOD_DECLARATIONS(deleteQuery);
  _WRAP_METHOD_DECLARATIONS(isQuery);
  _WRAP_METHOD_DECLARATIONS(beginQuery);
  _WRAP_METHOD_DECLARATIONS(endQuery);
  _WRAP_METHOD_DECLARATIONS(getQuery);
  _WRAP_METHOD_DECLARATIONS(getQueryParameter);

  // Samplers (WebGL2)
  _WRAP_METHOD_DECLARATIONS(createSampler);
  _WRAP_METHOD_DECLARATIONS(deleteSampler);
  _WRAP_METHOD_DECLARATIONS(bindSampler);
  _WRAP_METHOD_DECLARATIONS(isSampler);
  _WRAP_METHOD_DECLARATIONS(samplerParameteri);
  _WRAP_METHOD_DECLARATIONS(samplerParameterf);
  _WRAP_METHOD_DECLARATIONS(getSamplerParameter);

  // Sync objects (WebGL2)
  _WRAP_METHOD_DECLARATIONS(fenceSync);
  _WRAP_METHOD_DECLARATIONS(isSync);
  _WRAP_METHOD_DECLARATIONS(deleteSync);
  _WRAP_METHOD_DECLARATIONS(clientWaitSync);
  _WRAP_METHOD_DECLARATIONS(waitSync);
  _WRAP_METHOD_DECLARATIONS(getSyncParameter);

  // Transform feedback (WebGL2)
  _WRAP_METHOD_DECLARATIONS(createTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(deleteTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(isTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(bindTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(beginTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(endTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(transformFeedbackVaryings);
  _WRAP_METHOD_DECLARATIONS(getTransformFeedbackVarying);
  _WRAP_METHOD_DECLARATIONS(pauseTransformFeedback);
  _WRAP_METHOD_DECLARATIONS(resumeTransformFeedback);

  // Uniform buffer objects (WebGL2)
  _WRAP_METHOD_DECLARATIONS(bindBufferBase);
  _WRAP_METHOD_DECLARATIONS(bindBufferRange);
  _WRAP_METHOD_DECLARATIONS(getUniformIndices);
  _WRAP_METHOD_DECLARATIONS(getActiveUniforms);
  _WRAP_METHOD_DECLARATIONS(getUniformBlockIndex);
  _WRAP_METHOD_DECLARATIONS(getActiveUniformBlockParameter);
  _WRAP_METHOD_DECLARATIONS(getActiveUniformBlockName);
  _WRAP_METHOD_DECLARATIONS(uniformBlockBinding);

  // Vertex Array Object (WebGL2)
  _WRAP_METHOD_DECLARATIONS(createVertexArray);
  _WRAP_METHOD_DECLARATIONS(deleteVertexArray);
  _WRAP_METHOD_DECLARATIONS(isVertexArray);
  _WRAP_METHOD_DECLARATIONS(bindVertexArray);

  // Extensions
  _WRAP_METHOD_DECLARATIONS(getSupportedExtensions);
  _WRAP_METHOD_DECLARATIONS(getExtension);

  // Exponent extensions
  _WRAP_METHOD_DECLARATIONS(endFrameEXP);
  _WRAP_METHOD_DECLARATIONS(flushEXP);
};
