// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class GLView: ExpoView, EXGLContextDelegate {
  lazy var glContext: EXGLContext = {
    guard let legacyModuleRegistry = appContext?.legacyModuleRegistry else {
      fatalError("Legacy module registry is not available")
    }
    return EXGLContext(delegate: self, andModuleRegistry: legacyModuleRegistry)
  }()

  lazy var eaglContext: EAGLContext = glContext.createSharedEAGLContext()

  // Props
  var msaaSamples: Int = 0
  var enableExperimentalWorkletSupport: Bool = false

  // Events
  var onSurfaceCreate: EventDispatcher? = EventDispatcher()

  // GL
  var layerWidth: GLint = 0
  var layerHeight: GLint = 0
  var viewFramebuffer: GLuint = 0
  var viewColorbuffer: GLuint = 0
  var viewDepthStencilbuffer: GLuint = 0
  var msaaFramebuffer: GLuint = 0
  var msaaRenderbuffer: GLuint = 0

  var displayLink: CADisplayLink?
  var isAfterLayout: Bool = false
  var isRenderbufferPresented: Bool = true
  var viewBuffersSize: CGSize = .zero

  override static var layerClass: AnyClass {
    return CAEAGLLayer.self
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    // Set up a draw loop
    displayLink = CADisplayLink(target: self, selector: #selector(drawGL))
    displayLink?.add(to: RunLoop.main, forMode: .common)

    contentScaleFactor = EXUtilities.screenScale()

    // Initialize properties of our backing CAEAGLLayer
    if let eaglLayer = layer as? CAEAGLLayer {
      eaglLayer.isOpaque = false
      eaglLayer.drawableProperties = [
        kEAGLDrawablePropertyRetainedBacking: false,
        kEAGLDrawablePropertyColorFormat: kEAGLColorFormatRGBA8
      ]
    }
  }

  func runOnUIThread(_ callback: @escaping () -> Void) {
    DispatchQueue.main.sync {
      glContext.run(in: self.eaglContext, callback: callback)
    }
  }

  // MARK: - UIView

  override func layoutSubviews() {
    resizeViewBuffersToWidth(width: contentScaleFactor * frame.size.width, height: contentScaleFactor * frame.size.height)

    isAfterLayout = true
    glContext.prepare(nil, andEnableExperimentalWorkletSupport: enableExperimentalWorkletSupport)
    maybeCallSurfaceCreated()
  }

  override func removeFromSuperview() {
    glContext.destroy()
    displayLink?.invalidate()
    displayLink = nil
    super.removeFromSuperview()
  }

  // MARK: - GL

  func resizeViewBuffersToWidth(width: Double, height: Double) {
    let newViewBuffersSize = CGSize(width: width, height: height)

    // Don't resize if size hasn't changed and the current size is not zero
    if CGSizeEqualToSize(newViewBuffersSize, viewBuffersSize) && !CGSizeEqualToSize(viewBuffersSize, .zero) {
      return
    }

    // update viewBuffersSize on UI thread (before actual resize takes place)
    // to get rid of redundant resizes if layoutSubviews is called multiple times with the same frame size
    viewBuffersSize = newViewBuffersSize

    // swiftlint:disable:next closure_body_length
    glContext.runAsync { [self] in
      // Save surrounding framebuffer/renderbuffer
      var prevFramebuffer: GLuint = 0
      var prevRenderbuffer: GLuint = 0

      glGetIntegerv(GLenum(GL_FRAMEBUFFER_BINDING), &prevFramebuffer)
      glGetIntegerv(GLenum(GL_RENDERBUFFER_BINDING), &prevRenderbuffer)
      if prevFramebuffer == viewFramebuffer {
        prevFramebuffer = 0
      }

      // Delete old buffers if they exist
      deleteViewBuffers()

      // Set up view framebuffer
      glGenFramebuffers(1, &viewFramebuffer)
      glBindFramebuffer(GLenum(GL_FRAMEBUFFER), viewFramebuffer)

      // Set up new color renderbuffer
      glGenRenderbuffers(1, &viewColorbuffer)
      glBindRenderbuffer(GLenum(GL_RENDERBUFFER), viewColorbuffer)

      runOnUIThread { [self] in
        glBindRenderbuffer(GLenum(GL_RENDERBUFFER), viewColorbuffer)
        eaglContext.renderbufferStorage(Int(GL_RENDERBUFFER), from: self.layer as? CAEAGLLayer)
      }

      glFramebufferRenderbuffer(
        GLenum(GL_FRAMEBUFFER),
        GLenum(GL_COLOR_ATTACHMENT0),
        GLenum(GL_RENDERBUFFER),
        viewColorbuffer
      )
      glGetRenderbufferParameteriv(
        GLenum(GL_RENDERBUFFER),
        GLenum(GL_RENDERBUFFER_WIDTH),
        &layerWidth
      )
      glGetRenderbufferParameteriv(
        GLenum(GL_RENDERBUFFER),
        GLenum(GL_RENDERBUFFER_HEIGHT),
        &layerHeight
      )

      // Set up MSAA framebuffer/renderbuffer
      glGenFramebuffers(1, &msaaFramebuffer)
      glGenRenderbuffers(1, &msaaRenderbuffer)
      glBindFramebuffer(GLenum(GL_FRAMEBUFFER), msaaFramebuffer)
      glBindRenderbuffer(GLenum(GL_RENDERBUFFER), msaaRenderbuffer)
      glRenderbufferStorageMultisample(
        GLenum(GL_RENDERBUFFER),
        GLsizei(msaaSamples),
        GLenum(GL_RGBA8),
        layerWidth,
        layerHeight
      )
      glFramebufferRenderbuffer(
        GLenum(GL_FRAMEBUFFER),
        GLenum(GL_COLOR_ATTACHMENT0),
        GLenum(GL_RENDERBUFFER),
        msaaRenderbuffer
      )

      EXGLContextSetDefaultFramebuffer(glContext.contextId, GLint(msaaFramebuffer))

      // Set up new depth+stencil renderbuffer
      glGenRenderbuffers(1, &viewDepthStencilbuffer)
      glBindRenderbuffer(GLenum(GL_RENDERBUFFER), viewDepthStencilbuffer)
      glRenderbufferStorageMultisample(
        GLenum(GL_RENDERBUFFER),
        GLsizei(msaaSamples),
        GLenum(GL_DEPTH24_STENCIL8),
        layerWidth,
        layerHeight
      )
      glFramebufferRenderbuffer(
        GLenum(GL_FRAMEBUFFER),
        GLenum(GL_DEPTH_ATTACHMENT),
        GLenum(GL_RENDERBUFFER),
        viewDepthStencilbuffer
      )
      glFramebufferRenderbuffer(
        GLenum(GL_FRAMEBUFFER),
        GLenum(GL_STENCIL_ATTACHMENT),
        GLenum(GL_RENDERBUFFER),
        viewDepthStencilbuffer
      )

      // Resize viewport
      glViewport(0, 0, GLsizei(width), GLsizei(height))

      // Restore surrounding framebuffer/renderbuffer
      if prevFramebuffer != 0 {
        glBindFramebuffer(GLenum(GL_FRAMEBUFFER), prevFramebuffer)
      }
      glBindRenderbuffer(GLenum(GL_RENDERBUFFER), prevRenderbuffer)
    }
  }

  func maybeCallSurfaceCreated() {
    // Because initialization things happen asynchronously,
    // we need to be sure that they all are done before we pass GL object to JS.

    if onSurfaceCreate != nil && glContext.isInitialized() && isAfterLayout {
      onSurfaceCreate?([
        "exglCtxId": glContext.contextId
      ])

      // unset onSurfaceCreate - it will not be needed anymore
      onSurfaceCreate = nil
    }
  }

  @objc
  func drawGL() {
    // exglCtxId may be unset if we get here (on the UI thread) before EXGLContextCreate(...) is
    // called on the JS thread to create the EXGL context and save its id (see EXGLContext.initializeContextWithBridge method).
    // In this case no GL work has been sent yet so we skip this frame.
    //
    // _viewFramebuffer may be 0 if we haven't had a layout event yet and so the size of the
    // framebuffer to create is unknown. In this case we have nowhere to render to so we skip
    // this frame (the GL work to run remains on the queue for next time).

    if glContext.isInitialized() && viewFramebuffer != 0 {
      // Present current state of view buffers
      // This happens exactly at `gl.endFrameEXP()` in the queue
      if viewColorbuffer != 0 && !isRenderbufferPresented {
        // bind renderbuffer and present it on the layer
        glContext.runAsync {
          glBindRenderbuffer(GLenum(GL_RENDERBUFFER), self.viewColorbuffer)
          self.eaglContext.presentRenderbuffer(Int(GL_RENDERBUFFER))
        }

        // mark renderbuffer as presented
        isRenderbufferPresented = true
      }
    }
  }

  // [GL thread] blits framebuffers and then sets a flag that informs UI thread
  // about presenting the new content of the renderbuffer on the next draw call
  func blitFramebuffers() {
    if glContext.isInitialized() && viewFramebuffer != 0 && viewColorbuffer != 0 {
      // Save surrounding framebuffer
      var prevFramebuffer: GLuint = 0
      glGetIntegerv(GLenum(GL_FRAMEBUFFER_BINDING), &prevFramebuffer)
      if prevFramebuffer == viewFramebuffer {
        prevFramebuffer = 0
      }

      // Resolve multisampling and present
      glBindFramebuffer(GLenum(GL_READ_FRAMEBUFFER), msaaFramebuffer)
      glBindFramebuffer(GLenum(GL_DRAW_FRAMEBUFFER), viewFramebuffer)

      // glBlitFramebuffer works only on OpenGL ES 3.0, so we need a fallback to Apple's extension for OpenGL ES 2.0
      if glContext.eaglCtx.api == .openGLES3 {
        glBlitFramebuffer(
          0,
          0,
          layerWidth,
          layerHeight,
          0,
          0,
          layerWidth,
          layerHeight,
          GLbitfield(GL_COLOR_BUFFER_BIT),
          GLenum(GL_NEAREST)
        )
      } else {
        glResolveMultisampleFramebufferAPPLE()
      }

      // Restore surrounding framebuffer
      if prevFramebuffer != 0 {
        glBindFramebuffer(GLenum(GL_FRAMEBUFFER), prevFramebuffer)
      }

      // mark renderbuffer as not presented
      isRenderbufferPresented = false
    }
  }

  func deleteViewBuffers() {
    if viewDepthStencilbuffer != 0 {
      glDeleteRenderbuffers(1, &viewDepthStencilbuffer)
      viewDepthStencilbuffer = 0
    }
    if viewColorbuffer != 0 {
      glDeleteRenderbuffers(1, &viewColorbuffer)
      viewColorbuffer = 0
    }
    if viewFramebuffer != 0 {
      glDeleteFramebuffers(1, &viewFramebuffer)
      viewFramebuffer = 0
    }
    if msaaRenderbuffer != 0 {
      glDeleteRenderbuffers(1, &msaaRenderbuffer)
      msaaRenderbuffer = 0
    }
    if msaaFramebuffer != 0 {
      glDeleteFramebuffers(1, &msaaFramebuffer)
      msaaFramebuffer = 0
    }
  }

  // MARK: - EXGLContextDelegate

  // [GL thread]
  func glContextFlushed(_ context: EXGLContext) {
    // blit framebuffers if endFrameEXP was called
    if EXGLContextNeedsRedraw(glContext.contextId) {
      // actually draw isn't yet finished, but it's here to prevent blitting the same thing multiple times
      EXGLContextDrawEnded(glContext.contextId)

      blitFramebuffers()
    }
  }

  // [JS thread]
  func glContextInitialized(_ context: EXGLContext) {
    maybeCallSurfaceCreated()
  }

  // [GL thread]
  func glContextWillDestroy(_ context: EXGLContext) {
    // Destroy GL objects owned by us
    deleteViewBuffers()
  }

  func glContextGetDefaultFramebuffer() -> EXGLObjectId {
    return msaaFramebuffer
  }
}
