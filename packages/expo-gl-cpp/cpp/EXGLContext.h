#include "UEXGL.h"
#include "EXJSUtils.h"
#include "TypedArrayJSI.h"

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

#include <jsi/jsi.h>

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

namespace jsi = facebook::jsi;

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
  inline jsi::Value addFutureToNextBatch(jsi::Runtime& runtime, F &&f) noexcept {
    auto exglObjId = createObject();
    addToNextBatch([=] {
      assert(objects.find(exglObjId) == objects.end());
      mapObject(exglObjId, f());
    });
    return static_cast<double>(exglObjId);
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
  bool supportsWebGL2 = false;

public:
  EXGLContext(jsi::Runtime& runtime, UEXGLContextId exglCtxId) {
    jsi::Object jsGl(runtime);
    jsGl.setProperty(runtime, jsi::PropNameID::forUtf8(runtime, "exglCtxId"), static_cast<double>(exglCtxId));
    installMethods(runtime, jsGl);
    installConstants(runtime, jsGl);

    // Save JavaScript object
    jsi::Value jsContextMap = runtime.global().getProperty(runtime, "__EXGLContexts");
    if (jsContextMap.isNull() || jsContextMap.isUndefined()) {
        runtime
          .global()
          .setProperty(runtime, "__EXGLContexts", jsi::Object(runtime));
    }
    runtime
      .global()
      .getProperty(runtime, "__EXGLContexts")
      .asObject(runtime)
      .setProperty(runtime, jsi::PropNameID::forUtf8(runtime, std::to_string(exglCtxId)), jsGl);

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

  static EXGLContext* ContextGet(UEXGLContextId exglCtxId);
  static UEXGLContextId ContextCreate(jsi::Runtime& runtime);
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
  void installMethods(jsi::Runtime& runtime, jsi::Object& jsGl);
  void installConstants(jsi::Runtime& runtime, jsi::Object& jsGl);

  template<typename F>
  inline jsi::Value getActiveInfo(
          jsi::Runtime& runtime,
          const jsi::Value* jsArgv,
          GLenum lengthParam,
          F &&glFunc);

  template<typename T>
  std::vector<T> jsArrayToVector(jsi::Runtime& runtime, const jsi::Array& jsArray) {
    int length = jsArray.length(runtime);
    std::vector<T> values(length);

    for (int i = 0; i < length; i++) {
      values[i] = static_cast<T>(jsArray.getValueAtIndex(runtime, i).asNumber());
    }
    return values;
  }

  template<>
  std::vector<std::string> jsArrayToVector(jsi::Runtime& runtime, const jsi::Array& jsArray) {
    int length = jsArray.length(runtime);
    std::vector<std::string> strings(length);

    for (int i = 0; i < length; i++) {
      strings[i] = jsArray.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime);
    }
    return strings;
  }

  bool jsValueToBool(jsi::Runtime& runtime, const jsi::Value& jsValue) {
    return jsValue.isBool()
      ? jsValue.getBool()
      : throw std::runtime_error(jsValue.toString(runtime).utf8(runtime) + " is not a bool value");
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

  // Load image data from an object with a `.localUri` member
  std::shared_ptr<uint8_t> loadImage(
          jsi::Runtime& runtime,
          const jsi::Value& object,
          int *fileWidth,
          int *fileHeight,
          int *fileComp);




// Standard method wrapper, run on JS thread, return a value
#define _WRAP_METHOD_DECLARATION(name)                                                              \
  static jsi::Value exglNativeStatic_##name(jsi::Runtime& runtime,                                  \
                                            const jsi::Value& jsThis,                               \
                                            const jsi::Value* jsArgv,                               \
                                            unsigned int argc);                                     \
  inline jsi::Value exglNativeInstance_##name(jsi::Runtime& runtime,                                \
                                              const jsi::Value& jsThis,                             \
                                              const jsi::Value* jsArgv,                             \
                                              unsigned int argc)

  // This listing follows the order in
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext

  // The WebGL context
  _WRAP_METHOD_DECLARATION(getContextAttributes);
  _WRAP_METHOD_DECLARATION(isContextLost);

  // Viewing and clipping
  _WRAP_METHOD_DECLARATION(scissor);
  _WRAP_METHOD_DECLARATION(viewport);

  // State information
  _WRAP_METHOD_DECLARATION(activeTexture);
  _WRAP_METHOD_DECLARATION(blendColor);
  _WRAP_METHOD_DECLARATION(blendEquation);
  _WRAP_METHOD_DECLARATION(blendEquationSeparate);
  _WRAP_METHOD_DECLARATION(blendFunc);
  _WRAP_METHOD_DECLARATION(blendFuncSeparate);
  _WRAP_METHOD_DECLARATION(clearColor);
  _WRAP_METHOD_DECLARATION(clearDepth);
  _WRAP_METHOD_DECLARATION(clearStencil);
  _WRAP_METHOD_DECLARATION(colorMask);
  _WRAP_METHOD_DECLARATION(cullFace);
  _WRAP_METHOD_DECLARATION(depthFunc);
  _WRAP_METHOD_DECLARATION(depthMask);
  _WRAP_METHOD_DECLARATION(depthRange);
  _WRAP_METHOD_DECLARATION(disable);
  _WRAP_METHOD_DECLARATION(enable);
  _WRAP_METHOD_DECLARATION(frontFace);
  _WRAP_METHOD_DECLARATION(getParameter);
  _WRAP_METHOD_DECLARATION(getError);
  _WRAP_METHOD_DECLARATION(hint);
  _WRAP_METHOD_DECLARATION(isEnabled);
  _WRAP_METHOD_DECLARATION(lineWidth);
  _WRAP_METHOD_DECLARATION(pixelStorei);
  _WRAP_METHOD_DECLARATION(polygonOffset);
  _WRAP_METHOD_DECLARATION(sampleCoverage);
  _WRAP_METHOD_DECLARATION(stencilFunc);
  _WRAP_METHOD_DECLARATION(stencilFuncSeparate);
  _WRAP_METHOD_DECLARATION(stencilMask);
  _WRAP_METHOD_DECLARATION(stencilMaskSeparate);
  _WRAP_METHOD_DECLARATION(stencilOp);
  _WRAP_METHOD_DECLARATION(stencilOpSeparate);

  // Buffers
  _WRAP_METHOD_DECLARATION(bindBuffer);
  _WRAP_METHOD_DECLARATION(bufferData);
  _WRAP_METHOD_DECLARATION(bufferSubData);
  _WRAP_METHOD_DECLARATION(createBuffer);
  _WRAP_METHOD_DECLARATION(deleteBuffer);
  _WRAP_METHOD_DECLARATION(getBufferParameter);
  _WRAP_METHOD_DECLARATION(isBuffer);

  // Buffers (WebGL2)
  _WRAP_METHOD_DECLARATION(copyBufferSubData);
  _WRAP_METHOD_DECLARATION(getBufferSubData);

  // Framebuffers
  _WRAP_METHOD_DECLARATION(bindFramebuffer);
  _WRAP_METHOD_DECLARATION(checkFramebufferStatus);
  _WRAP_METHOD_DECLARATION(createFramebuffer);
  _WRAP_METHOD_DECLARATION(deleteFramebuffer);
  _WRAP_METHOD_DECLARATION(framebufferRenderbuffer);
  _WRAP_METHOD_DECLARATION(framebufferTexture2D);
  _WRAP_METHOD_DECLARATION(getFramebufferAttachmentParameter);
  _WRAP_METHOD_DECLARATION(isFramebuffer);
  _WRAP_METHOD_DECLARATION(readPixels);

  // Framebuffers (WebGL2)
  _WRAP_METHOD_DECLARATION(blitFramebuffer);
  _WRAP_METHOD_DECLARATION(framebufferTextureLayer);
  _WRAP_METHOD_DECLARATION(invalidateFramebuffer);
  _WRAP_METHOD_DECLARATION(invalidateSubFramebuffer);
  _WRAP_METHOD_DECLARATION(readBuffer);

  // Renderbuffers
  _WRAP_METHOD_DECLARATION(bindRenderbuffer);
  _WRAP_METHOD_DECLARATION(createRenderbuffer);
  _WRAP_METHOD_DECLARATION(deleteRenderbuffer);
  _WRAP_METHOD_DECLARATION(getRenderbufferParameter);
  _WRAP_METHOD_DECLARATION(isRenderbuffer);
  _WRAP_METHOD_DECLARATION(renderbufferStorage);

  // Renderbuffers (WebGL2)
  _WRAP_METHOD_DECLARATION(getInternalformatParameter);
  _WRAP_METHOD_DECLARATION(renderbufferStorageMultisample);

  // Textures
  _WRAP_METHOD_DECLARATION(bindTexture);
  _WRAP_METHOD_DECLARATION(compressedTexImage2D);
  _WRAP_METHOD_DECLARATION(compressedTexSubImage2D);
  _WRAP_METHOD_DECLARATION(copyTexImage2D);
  _WRAP_METHOD_DECLARATION(copyTexSubImage2D);
  _WRAP_METHOD_DECLARATION(createTexture);
  _WRAP_METHOD_DECLARATION(deleteTexture);
  _WRAP_METHOD_DECLARATION(generateMipmap);
  _WRAP_METHOD_DECLARATION(getTexParameter);
  _WRAP_METHOD_DECLARATION(isTexture);
  _WRAP_METHOD_DECLARATION(texImage2D);
  _WRAP_METHOD_DECLARATION(texSubImage2D);
  _WRAP_METHOD_DECLARATION(texParameterf);
  _WRAP_METHOD_DECLARATION(texParameteri);

  // Textures (WebGL2)
  _WRAP_METHOD_DECLARATION(texStorage2D);
  _WRAP_METHOD_DECLARATION(texStorage3D);
  _WRAP_METHOD_DECLARATION(texImage3D);
  _WRAP_METHOD_DECLARATION(texSubImage3D);
  _WRAP_METHOD_DECLARATION(copyTexSubImage3D);
  _WRAP_METHOD_DECLARATION(compressedTexImage3D);
  _WRAP_METHOD_DECLARATION(compressedTexSubImage3D);

  // Programs and shaders
  _WRAP_METHOD_DECLARATION(attachShader);
  _WRAP_METHOD_DECLARATION(bindAttribLocation);
  _WRAP_METHOD_DECLARATION(compileShader);
  _WRAP_METHOD_DECLARATION(createProgram);
  _WRAP_METHOD_DECLARATION(createShader);
  _WRAP_METHOD_DECLARATION(deleteProgram);
  _WRAP_METHOD_DECLARATION(deleteShader);
  _WRAP_METHOD_DECLARATION(detachShader);
  _WRAP_METHOD_DECLARATION(getAttachedShaders);
  _WRAP_METHOD_DECLARATION(getProgramParameter);
  _WRAP_METHOD_DECLARATION(getProgramInfoLog);
  _WRAP_METHOD_DECLARATION(getShaderParameter);
  _WRAP_METHOD_DECLARATION(getShaderPrecisionFormat);
  _WRAP_METHOD_DECLARATION(getShaderInfoLog);
  _WRAP_METHOD_DECLARATION(getShaderSource);
  _WRAP_METHOD_DECLARATION(isProgram);
  _WRAP_METHOD_DECLARATION(isShader);
  _WRAP_METHOD_DECLARATION(linkProgram);
  _WRAP_METHOD_DECLARATION(shaderSource);
  _WRAP_METHOD_DECLARATION(useProgram);
  _WRAP_METHOD_DECLARATION(validateProgram);

  // Programs and shaders (WebGL2)
  _WRAP_METHOD_DECLARATION(getFragDataLocation);

  // Uniforms and attributes
  _WRAP_METHOD_DECLARATION(disableVertexAttribArray);
  _WRAP_METHOD_DECLARATION(enableVertexAttribArray);
  _WRAP_METHOD_DECLARATION(getActiveAttrib);
  _WRAP_METHOD_DECLARATION(getActiveUniform);
  _WRAP_METHOD_DECLARATION(getAttribLocation);
  _WRAP_METHOD_DECLARATION(getUniform);
  _WRAP_METHOD_DECLARATION(getUniformLocation);
  _WRAP_METHOD_DECLARATION(getVertexAttrib);
  _WRAP_METHOD_DECLARATION(getVertexAttribOffset);
  _WRAP_METHOD_DECLARATION(uniform1f);
  _WRAP_METHOD_DECLARATION(uniform1fv);
  _WRAP_METHOD_DECLARATION(uniform1i);
  _WRAP_METHOD_DECLARATION(uniform1iv);
  _WRAP_METHOD_DECLARATION(uniform2f);
  _WRAP_METHOD_DECLARATION(uniform2fv);
  _WRAP_METHOD_DECLARATION(uniform2i);
  _WRAP_METHOD_DECLARATION(uniform2iv);
  _WRAP_METHOD_DECLARATION(uniform3f);
  _WRAP_METHOD_DECLARATION(uniform3fv);
  _WRAP_METHOD_DECLARATION(uniform3i);
  _WRAP_METHOD_DECLARATION(uniform3iv);
  _WRAP_METHOD_DECLARATION(uniform4f);
  _WRAP_METHOD_DECLARATION(uniform4fv);
  _WRAP_METHOD_DECLARATION(uniform4i);
  _WRAP_METHOD_DECLARATION(uniform4iv);
  _WRAP_METHOD_DECLARATION(uniformMatrix2fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix3fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix4fv);
  _WRAP_METHOD_DECLARATION(vertexAttrib1f);
  _WRAP_METHOD_DECLARATION(vertexAttrib1fv);
  _WRAP_METHOD_DECLARATION(vertexAttrib2f);
  _WRAP_METHOD_DECLARATION(vertexAttrib2fv);
  _WRAP_METHOD_DECLARATION(vertexAttrib3f);
  _WRAP_METHOD_DECLARATION(vertexAttrib3fv);
  _WRAP_METHOD_DECLARATION(vertexAttrib4f);
  _WRAP_METHOD_DECLARATION(vertexAttrib4fv);
  _WRAP_METHOD_DECLARATION(vertexAttribPointer);

  // Uniforms and attributes (WebGL2)
  _WRAP_METHOD_DECLARATION(uniform1ui);
  _WRAP_METHOD_DECLARATION(uniform2ui);
  _WRAP_METHOD_DECLARATION(uniform3ui);
  _WRAP_METHOD_DECLARATION(uniform4ui);
  _WRAP_METHOD_DECLARATION(uniform1uiv);
  _WRAP_METHOD_DECLARATION(uniform2uiv);
  _WRAP_METHOD_DECLARATION(uniform3uiv);
  _WRAP_METHOD_DECLARATION(uniform4uiv);
  _WRAP_METHOD_DECLARATION(uniformMatrix3x2fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix4x2fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix2x3fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix4x3fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix2x4fv);
  _WRAP_METHOD_DECLARATION(uniformMatrix3x4fv);
  _WRAP_METHOD_DECLARATION(vertexAttribI4i);
  _WRAP_METHOD_DECLARATION(vertexAttribI4ui);
  _WRAP_METHOD_DECLARATION(vertexAttribI4iv);
  _WRAP_METHOD_DECLARATION(vertexAttribI4uiv);
  _WRAP_METHOD_DECLARATION(vertexAttribIPointer);

  // Drawing buffers
  _WRAP_METHOD_DECLARATION(clear);
  _WRAP_METHOD_DECLARATION(drawArrays);
  _WRAP_METHOD_DECLARATION(drawElements);
  _WRAP_METHOD_DECLARATION(finish);
  _WRAP_METHOD_DECLARATION(flush);

  // Drawing buffers (WebGL2)
  _WRAP_METHOD_DECLARATION(vertexAttribDivisor);
  _WRAP_METHOD_DECLARATION(drawArraysInstanced);
  _WRAP_METHOD_DECLARATION(drawElementsInstanced);
  _WRAP_METHOD_DECLARATION(drawRangeElements);
  _WRAP_METHOD_DECLARATION(drawBuffers);
  _WRAP_METHOD_DECLARATION(clearBufferfv);
  _WRAP_METHOD_DECLARATION(clearBufferiv);
  _WRAP_METHOD_DECLARATION(clearBufferuiv);
  _WRAP_METHOD_DECLARATION(clearBufferfi);

  // Query objects (WebGL2)
  _WRAP_METHOD_DECLARATION(createQuery);
  _WRAP_METHOD_DECLARATION(deleteQuery);
  _WRAP_METHOD_DECLARATION(isQuery);
  _WRAP_METHOD_DECLARATION(beginQuery);
  _WRAP_METHOD_DECLARATION(endQuery);
  _WRAP_METHOD_DECLARATION(getQuery);
  _WRAP_METHOD_DECLARATION(getQueryParameter);

  // Samplers (WebGL2)
  _WRAP_METHOD_DECLARATION(createSampler);
  _WRAP_METHOD_DECLARATION(deleteSampler);
  _WRAP_METHOD_DECLARATION(bindSampler);
  _WRAP_METHOD_DECLARATION(isSampler);
  _WRAP_METHOD_DECLARATION(samplerParameteri);
  _WRAP_METHOD_DECLARATION(samplerParameterf);
  _WRAP_METHOD_DECLARATION(getSamplerParameter);

  // Sync objects (WebGL2)
  _WRAP_METHOD_DECLARATION(fenceSync);
  _WRAP_METHOD_DECLARATION(isSync);
  _WRAP_METHOD_DECLARATION(deleteSync);
  _WRAP_METHOD_DECLARATION(clientWaitSync);
  _WRAP_METHOD_DECLARATION(waitSync);
  _WRAP_METHOD_DECLARATION(getSyncParameter);

  // Transform feedback (WebGL2)
  _WRAP_METHOD_DECLARATION(createTransformFeedback);
  _WRAP_METHOD_DECLARATION(deleteTransformFeedback);
  _WRAP_METHOD_DECLARATION(isTransformFeedback);
  _WRAP_METHOD_DECLARATION(bindTransformFeedback);
  _WRAP_METHOD_DECLARATION(beginTransformFeedback);
  _WRAP_METHOD_DECLARATION(endTransformFeedback);
  _WRAP_METHOD_DECLARATION(transformFeedbackVaryings);
  _WRAP_METHOD_DECLARATION(getTransformFeedbackVarying);
  _WRAP_METHOD_DECLARATION(pauseTransformFeedback);
  _WRAP_METHOD_DECLARATION(resumeTransformFeedback);

  // Uniform buffer objects (WebGL2)
  _WRAP_METHOD_DECLARATION(bindBufferBase);
  _WRAP_METHOD_DECLARATION(bindBufferRange);
  _WRAP_METHOD_DECLARATION(getUniformIndices);
  _WRAP_METHOD_DECLARATION(getActiveUniforms);
  _WRAP_METHOD_DECLARATION(getUniformBlockIndex);
  _WRAP_METHOD_DECLARATION(getActiveUniformBlockParameter);
  _WRAP_METHOD_DECLARATION(getActiveUniformBlockName);
  _WRAP_METHOD_DECLARATION(uniformBlockBinding);

  // Vertex Array Object (WebGL2)
  _WRAP_METHOD_DECLARATION(createVertexArray);
  _WRAP_METHOD_DECLARATION(deleteVertexArray);
  _WRAP_METHOD_DECLARATION(isVertexArray);
  _WRAP_METHOD_DECLARATION(bindVertexArray);

  // Extensions
  _WRAP_METHOD_DECLARATION(getSupportedExtensions);
  _WRAP_METHOD_DECLARATION(getExtension);

  // Exponent extensions
  _WRAP_METHOD_DECLARATION(endFrameEXP);
  _WRAP_METHOD_DECLARATION(flushEXP);
};
