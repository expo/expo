#include "EXGLContext.h"

#define _INSTALL_METHOD(name)                                                       \
  auto name ## Fn = jsi::Function::createFromHostFunction(                          \
    runtime,                                                                        \
    jsi::PropNameID::forUtf8(runtime, #name),                                       \
    0,                                                                              \
    EXGLContext::exglNativeStatic_ ## name);                                        \
  jsGl.setProperty(                                                                 \
          runtime,                                                                  \
          jsi::PropNameID::forUtf8(runtime, #name),                                 \
          name ## Fn)


void EXGLContext::installMethods(jsi::Runtime& runtime, jsi::Object& jsGl) {
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
}
