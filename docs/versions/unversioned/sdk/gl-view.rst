GLView
======

.. py:class:: Exponent.GLView

   A ``View`` that acts as an OpenGL ES render target. On mounting, an OpenGL ES
   context is created. Its drawing buffer is presented as the contents of the
   ``View`` every frame.

   Other than the regular ``View`` props for layout and touch handling, the
   following props are available:

   .. py:attribute:: onContextCreate

      A function that will be called when the OpenGL ES context is created. The
      function is passed a single argument :ref:`gl <gl-object>` that acts as an interface to
      the underlying OpenGL ES context.


.. _gl-object:

The ``gl`` object
-----------------

Once the component is mounted and the OpenGL ES context has been created, the
`gl` object received through the :any:`onContextCreate
<Exponent.GLView.onContextCreate>` prop becomes the interface to the OpenGL ES
context, providing a WebGL-like API. It resembles a `WebGLRenderingContext
<https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14>`_ in the WebGL 1
spec. An additional method `endFrameExp` is present which notifies the context
that the current frame is ready to be presented. This is similar to a 'swap
buffers' API call in other OpenGL platforms.

As of SDK 11.0.0, not all WebGL functionality has been implemented. We plan to
achieve more coverage of the API in upcoming SDK versions.

The following `WebGLRenderContext` methods are currently unimplemented:

* Buffer

  * ``isBuffer``

* Texture

  * ``compressedTexImage2D``
  * ``compressedTexSubImage2D``
  * ``copyTexImage2D``
  * ``copyTexSubImage2D``
  * ``getTexParameter``
  * ``isTexture``
  * ``texSubImage2D``

* Program an shaders

  * ``bindAttribLocation``
  * ``getAttachedShaders``
  * ``isProgram``
  * ``isShader``

* Uniform an attributes

  * ``getUniform``
  * ``getVertexAttrib``
  * ``getVertexAttribOffset``
  * ``vertexAttrib1fv``
  * ``vertexAttrib2fv``
  * ``vertexAttrib3fv``
  * ``vertexAttrib4fv``

* Misc

  * ``finish``
  * ``getSupportedExtensions``

* Framebuffer

  * ``checkFramebufferStatus``
  * ``createFramebuffer``
  * ``deleteFramebuffer``
  * ``framebufferRenderbuffer``
  * ``framebufferTexture2D``
  * ``getFramebufferAttachmentParameter``
  * ``isFramebuffer``

* Renderbuffer

  * ``bindRenderbuffer``
  * ``createRenderbuffer``
  * ``deleteRenderbuffer``
  * ``getRenderbufferParameter``
  * ``isRenderbuffer``
  * ``renderbufferStorage``

``readPixels`` is currently only supported on Android.

``texImage2D`` only supports the 9-argument form. The last argument must either be
an `ArrayBuffer` with the texture data as in the WebGL spec, or be an
`Exponent.Asset` refering to an image to use as the source for the texture.

For efficiency reasons the current implementations of the methods don't perform
type or bounds checking on their arguments. So, passing invalid arguments could
cause a native crash. We plan to update the API to perform argument checking in
upcoming SDK versions.

