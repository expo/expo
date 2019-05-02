// TODO: copy-paste from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5344bfc80508c53a23dae37b860fb0c905ff7b24/types/webgl2/index.d.ts
export default interface WebGL2RenderingCOntext extends WebGLRenderingContext {
  readonly READ_BUFFER: number;                                   // 0x0C02
  readonly UNPACK_ROW_LENGTH: number;                             // 0x0CF2
  readonly UNPACK_SKIP_ROWS: number;                              // 0x0CF3
  readonly UNPACK_SKIP_PIXELS: number;                            // 0x0CF4
  readonly PACK_ROW_LENGTH: number;                               // 0x0D02
  readonly PACK_SKIP_ROWS: number;                                // 0x0D03
  readonly PACK_SKIP_PIXELS: number;                              // 0x0D04
  readonly COLOR: number;                                         // 0x1800
  readonly DEPTH: number;                                         // 0x1801
  readonly STENCIL: number;                                       // 0x1802
  readonly RED: number;                                           // 0x1903
  readonly RGB8: number;                                          // 0x8051
  readonly RGBA8: number;                                         // 0x8058
  readonly RGB10_A2: number;                                      // 0x8059
  readonly TEXTURE_BINDING_3D: number;                            // 0x806A
  readonly UNPACK_SKIP_IMAGES: number;                            // 0x806D
  readonly UNPACK_IMAGE_HEIGHT: number;                           // 0x806E
  readonly TEXTURE_3D: number;                                    // 0x806F
  readonly TEXTURE_WRAP_R: number;                                // 0x8072
  readonly MAX_3D_TEXTURE_SIZE: number;                           // 0x8073
  readonly UNSIGNED_INT_2_10_10_10_REV: number;                   // 0x8368
  readonly MAX_ELEMENTS_VERTICES: number;                         // 0x80E8
  readonly MAX_ELEMENTS_INDICES: number;                          // 0x80E9
  readonly TEXTURE_MIN_LOD: number;                               // 0x813A
  readonly TEXTURE_MAX_LOD: number;                               // 0x813B
  readonly TEXTURE_BASE_LEVEL: number;                            // 0x813C
  readonly TEXTURE_MAX_LEVEL: number;                             // 0x813D
  readonly MIN: number;                                           // 0x8007
  readonly MAX: number;                                           // 0x8008
  readonly DEPTH_COMPONENT24: number;                             // 0x81A6
  readonly MAX_TEXTURE_LOD_BIAS: number;                          // 0x84FD
  readonly TEXTURE_COMPARE_MODE: number;                          // 0x884C
  readonly TEXTURE_COMPARE_FUNC: number;                          // 0x884D
  readonly CURRENT_QUERY: number;                                 // 0x8865
  readonly QUERY_RESULT: number;                                  // 0x8866
  readonly QUERY_RESULT_AVAILABLE: number;                        // 0x8867
  readonly STREAM_READ: number;                                   // 0x88E1
  readonly STREAM_COPY: number;                                   // 0x88E2
  readonly STATIC_READ: number;                                   // 0x88E5
  readonly STATIC_COPY: number;                                   // 0x88E6
  readonly DYNAMIC_READ: number;                                  // 0x88E9
  readonly DYNAMIC_COPY: number;                                  // 0x88EA
  readonly MAX_DRAW_BUFFERS: number;                              // 0x8824
  readonly DRAW_BUFFER0: number;                                  // 0x8825
  readonly DRAW_BUFFER1: number;                                  // 0x8826
  readonly DRAW_BUFFER2: number;                                  // 0x8827
  readonly DRAW_BUFFER3: number;                                  // 0x8828
  readonly DRAW_BUFFER4: number;                                  // 0x8829
  readonly DRAW_BUFFER5: number;                                  // 0x882A
  readonly DRAW_BUFFER6: number;                                  // 0x882B
  readonly DRAW_BUFFER7: number;                                  // 0x882C
  readonly DRAW_BUFFER8: number;                                  // 0x882D
  readonly DRAW_BUFFER9: number;                                  // 0x882E
  readonly DRAW_BUFFER10: number;                                 // 0x882F
  readonly DRAW_BUFFER11: number;                                 // 0x8830
  readonly DRAW_BUFFER12: number;                                 // 0x8831
  readonly DRAW_BUFFER13: number;                                 // 0x8832
  readonly DRAW_BUFFER14: number;                                 // 0x8833
  readonly DRAW_BUFFER15: number;                                 // 0x8834
  readonly MAX_FRAGMENT_UNIFORM_COMPONENTS: number;               // 0x8B49
  readonly MAX_VERTEX_UNIFORM_COMPONENTS: number;                 // 0x8B4A
  readonly SAMPLER_3D: number;                                    // 0x8B5F
  readonly SAMPLER_2D_SHADOW: number;                             // 0x8B62
  readonly FRAGMENT_SHADER_DERIVATIVE_HINT: number;               // 0x8B8B
  readonly PIXEL_PACK_BUFFER: number;                             // 0x88EB
  readonly PIXEL_UNPACK_BUFFER: number;                           // 0x88EC
  readonly PIXEL_PACK_BUFFER_BINDING: number;                     // 0x88ED
  readonly PIXEL_UNPACK_BUFFER_BINDING: number;                   // 0x88EF
  readonly FLOAT_MAT2x3: number;                                  // 0x8B65
  readonly FLOAT_MAT2x4: number;                                  // 0x8B66
  readonly FLOAT_MAT3x2: number;                                  // 0x8B67
  readonly FLOAT_MAT3x4: number;                                  // 0x8B68
  readonly FLOAT_MAT4x2: number;                                  // 0x8B69
  readonly FLOAT_MAT4x3: number;                                  // 0x8B6A
  readonly SRGB: number;                                          // 0x8C40
  readonly SRGB8: number;                                         // 0x8C41
  readonly SRGB8_ALPHA8: number;                                  // 0x8C43
  readonly COMPARE_REF_TO_TEXTURE: number;                        // 0x884E
  readonly RGBA32F: number;                                       // 0x8814
  readonly RGB32F: number;                                        // 0x8815
  readonly RGBA16F: number;                                       // 0x881A
  readonly RGB16F: number;                                        // 0x881B
  readonly VERTEX_ATTRIB_ARRAY_INTEGER: number;                   // 0x88FD
  readonly MAX_ARRAY_TEXTURE_LAYERS: number;                      // 0x88FF
  readonly MIN_PROGRAM_TEXEL_OFFSET: number;                      // 0x8904
  readonly MAX_PROGRAM_TEXEL_OFFSET: number;                      // 0x8905
  readonly MAX_VARYING_COMPONENTS: number;                        // 0x8B4B
  readonly TEXTURE_2D_ARRAY: number;                              // 0x8C1A
  readonly TEXTURE_BINDING_2D_ARRAY: number;                      // 0x8C1D
  readonly R11F_G11F_B10F: number;                                // 0x8C3A
  readonly UNSIGNED_INT_10F_11F_11F_REV: number;                  // 0x8C3B
  readonly RGB9_E5: number;                                       // 0x8C3D
  readonly UNSIGNED_INT_5_9_9_9_REV: number;                      // 0x8C3E
  readonly TRANSFORM_FEEDBACK_BUFFER_MODE: number;                // 0x8C7F
  readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: number;    // 0x8C80
  readonly TRANSFORM_FEEDBACK_VARYINGS: number;                   // 0x8C83
  readonly TRANSFORM_FEEDBACK_BUFFER_START: number;               // 0x8C84
  readonly TRANSFORM_FEEDBACK_BUFFER_SIZE: number;                // 0x8C85
  readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: number;         // 0x8C88
  readonly RASTERIZER_DISCARD: number;                            // 0x8C89
  readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: number; // 0x8C8A
  readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: number;       // 0x8C8B
  readonly INTERLEAVED_ATTRIBS: number;                           // 0x8C8C
  readonly SEPARATE_ATTRIBS: number;                              // 0x8C8D
  readonly TRANSFORM_FEEDBACK_BUFFER: number;                     // 0x8C8E
  readonly TRANSFORM_FEEDBACK_BUFFER_BINDING: number;             // 0x8C8F
  readonly RGBA32UI: number;                                      // 0x8D70
  readonly RGB32UI: number;                                       // 0x8D71
  readonly RGBA16UI: number;                                      // 0x8D76
  readonly RGB16UI: number;                                       // 0x8D77
  readonly RGBA8UI: number;                                       // 0x8D7C
  readonly RGB8UI: number;                                        // 0x8D7D
  readonly RGBA32I: number;                                       // 0x8D82
  readonly RGB32I: number;                                        // 0x8D83
  readonly RGBA16I: number;                                       // 0x8D88
  readonly RGB16I: number;                                        // 0x8D89
  readonly RGBA8I: number;                                        // 0x8D8E
  readonly RGB8I: number;                                         // 0x8D8F
  readonly RED_INTEGER: number;                                   // 0x8D94
  readonly RGB_INTEGER: number;                                   // 0x8D98
  readonly RGBA_INTEGER: number;                                  // 0x8D99
  readonly SAMPLER_2D_ARRAY: number;                              // 0x8DC1
  readonly SAMPLER_2D_ARRAY_SHADOW: number;                       // 0x8DC4
  readonly SAMPLER_CUBE_SHADOW: number;                           // 0x8DC5
  readonly UNSIGNED_INT_VEC2: number;                             // 0x8DC6
  readonly UNSIGNED_INT_VEC3: number;                             // 0x8DC7
  readonly UNSIGNED_INT_VEC4: number;                             // 0x8DC8
  readonly INT_SAMPLER_2D: number;                                // 0x8DCA
  readonly INT_SAMPLER_3D: number;                                // 0x8DCB
  readonly INT_SAMPLER_CUBE: number;                              // 0x8DCC
  readonly INT_SAMPLER_2D_ARRAY: number;                          // 0x8DCF
  readonly UNSIGNED_INT_SAMPLER_2D: number;                       // 0x8DD2
  readonly UNSIGNED_INT_SAMPLER_3D: number;                       // 0x8DD3
  readonly UNSIGNED_INT_SAMPLER_CUBE: number;                     // 0x8DD4
  readonly UNSIGNED_INT_SAMPLER_2D_ARRAY: number;                 // 0x8DD7
  readonly DEPTH_COMPONENT32F: number;                            // 0x8CAC
  readonly DEPTH32F_STENCIL8: number;                             // 0x8CAD
  readonly FLOAT_32_UNSIGNED_INT_24_8_REV: number;                // 0x8DAD
  readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: number;         // 0x8210
  readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: number;         // 0x8211
  readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE: number;               // 0x8212
  readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: number;             // 0x8213
  readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: number;              // 0x8214
  readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: number;             // 0x8215
  readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: number;             // 0x8216
  readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: number;           // 0x8217
  readonly FRAMEBUFFER_DEFAULT: number;                           // 0x8218
  //readonly DEPTH_STENCIL_ATTACHMENT: number;                      // 0x821A /* Already defined in WebGL1 constants */
  //readonly DEPTH_STENCIL: number;                                 // 0x84F9 /* Already defined in WebGL1 constants */
  readonly UNSIGNED_INT_24_8: number;                             // 0x84FA
  readonly DEPTH24_STENCIL8: number;                              // 0x88F0
  readonly UNSIGNED_NORMALIZED: number;                           // 0x8C17
  readonly DRAW_FRAMEBUFFER_BINDING: number;                      // 0x8CA6 /* Same as FRAMEBUFFER_BINDING */
  readonly READ_FRAMEBUFFER: number;                              // 0x8CA8
  readonly DRAW_FRAMEBUFFER: number;                              // 0x8CA9
  readonly READ_FRAMEBUFFER_BINDING: number;                      // 0x8CAA
  readonly RENDERBUFFER_SAMPLES: number;                          // 0x8CAB
  readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: number;          // 0x8CD4
  readonly MAX_COLOR_ATTACHMENTS: number;                         // 0x8CDF
  readonly COLOR_ATTACHMENT1: number;                             // 0x8CE1
  readonly COLOR_ATTACHMENT2: number;                             // 0x8CE2
  readonly COLOR_ATTACHMENT3: number;                             // 0x8CE3
  readonly COLOR_ATTACHMENT4: number;                             // 0x8CE4
  readonly COLOR_ATTACHMENT5: number;                             // 0x8CE5
  readonly COLOR_ATTACHMENT6: number;                             // 0x8CE6
  readonly COLOR_ATTACHMENT7: number;                             // 0x8CE7
  readonly COLOR_ATTACHMENT8: number;                             // 0x8CE8
  readonly COLOR_ATTACHMENT9: number;                             // 0x8CE9
  readonly COLOR_ATTACHMENT10: number;                            // 0x8CEA
  readonly COLOR_ATTACHMENT11: number;                            // 0x8CEB
  readonly COLOR_ATTACHMENT12: number;                            // 0x8CEC
  readonly COLOR_ATTACHMENT13: number;                            // 0x8CED
  readonly COLOR_ATTACHMENT14: number;                            // 0x8CEE
  readonly COLOR_ATTACHMENT15: number;                            // 0x8CEF
  readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: number;            // 0x8D56
  readonly MAX_SAMPLES: number;                                   // 0x8D57
  readonly HALF_FLOAT: number;                                    // 0x140B
  readonly RG: number;                                            // 0x8227
  readonly RG_INTEGER: number;                                    // 0x8228
  readonly R8: number;                                            // 0x8229
  readonly RG8: number;                                           // 0x822B
  readonly R16F: number;                                          // 0x822D
  readonly R32F: number;                                          // 0x822E
  readonly RG16F: number;                                         // 0x822F
  readonly RG32F: number;                                         // 0x8230
  readonly R8I: number;                                           // 0x8231
  readonly R8UI: number;                                          // 0x8232
  readonly R16I: number;                                          // 0x8233
  readonly R16UI: number;                                         // 0x8234
  readonly R32I: number;                                          // 0x8235
  readonly R32UI: number;                                         // 0x8236
  readonly RG8I: number;                                          // 0x8237
  readonly RG8UI: number;                                         // 0x8238
  readonly RG16I: number;                                         // 0x8239
  readonly RG16UI: number;                                        // 0x823A
  readonly RG32I: number;                                         // 0x823B
  readonly RG32UI: number;                                        // 0x823C
  readonly VERTEX_ARRAY_BINDING: number;                          // 0x85B5
  readonly R8_SNORM: number;                                      // 0x8F94
  readonly RG8_SNORM: number;                                     // 0x8F95
  readonly RGB8_SNORM: number;                                    // 0x8F96
  readonly RGBA8_SNORM: number;                                   // 0x8F97
  readonly SIGNED_NORMALIZED: number;                             // 0x8F9C
  readonly COPY_READ_BUFFER: number;                              // 0x8F36
  readonly COPY_WRITE_BUFFER: number;                             // 0x8F37
  readonly COPY_READ_BUFFER_BINDING: number;                      // 0x8F36 /* Same as COPY_READ_BUFFER */
  readonly COPY_WRITE_BUFFER_BINDING: number;                     // 0x8F37 /* Same as COPY_WRITE_BUFFER */
  readonly UNIFORM_BUFFER: number;                                // 0x8A11
  readonly UNIFORM_BUFFER_BINDING: number;                        // 0x8A28
  readonly UNIFORM_BUFFER_START: number;                          // 0x8A29
  readonly UNIFORM_BUFFER_SIZE: number;                           // 0x8A2A
  readonly MAX_VERTEX_UNIFORM_BLOCKS: number;                     // 0x8A2B
  readonly MAX_FRAGMENT_UNIFORM_BLOCKS: number;                   // 0x8A2D
  readonly MAX_COMBINED_UNIFORM_BLOCKS: number;                   // 0x8A2E
  readonly MAX_UNIFORM_BUFFER_BINDINGS: number;                   // 0x8A2F
  readonly MAX_UNIFORM_BLOCK_SIZE: number;                        // 0x8A30
  readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: number;        // 0x8A31
  readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: number;      // 0x8A33
  readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT: number;               // 0x8A34
  readonly ACTIVE_UNIFORM_BLOCKS: number;                         // 0x8A36
  readonly UNIFORM_TYPE: number;                                  // 0x8A37
  readonly UNIFORM_SIZE: number;                                  // 0x8A38
  readonly UNIFORM_BLOCK_INDEX: number;                           // 0x8A3A
  readonly UNIFORM_OFFSET: number;                                // 0x8A3B
  readonly UNIFORM_ARRAY_STRIDE: number;                          // 0x8A3C
  readonly UNIFORM_MATRIX_STRIDE: number;                         // 0x8A3D
  readonly UNIFORM_IS_ROW_MAJOR: number;                          // 0x8A3E
  readonly UNIFORM_BLOCK_BINDING: number;                         // 0x8A3F
  readonly UNIFORM_BLOCK_DATA_SIZE: number;                       // 0x8A40
  readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS: number;                 // 0x8A42
  readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: number;          // 0x8A43
  readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: number;     // 0x8A44
  readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: number;   // 0x8A46
  readonly INVALID_INDEX: number;                                 // 0xFFFFFFFF
  readonly MAX_VERTEX_OUTPUT_COMPONENTS: number;                  // 0x9122
  readonly MAX_FRAGMENT_INPUT_COMPONENTS: number;                 // 0x9125
  readonly MAX_SERVER_WAIT_TIMEOUT: number;                       // 0x9111
  readonly OBJECT_TYPE: number;                                   // 0x9112
  readonly SYNC_CONDITION: number;                                // 0x9113
  readonly SYNC_STATUS: number;                                   // 0x9114
  readonly SYNC_FLAGS: number;                                    // 0x9115
  readonly SYNC_FENCE: number;                                    // 0x9116
  readonly SYNC_GPU_COMMANDS_COMPLETE: number;                    // 0x9117
  readonly UNSIGNALED: number;                                    // 0x9118
  readonly SIGNALED: number;                                      // 0x9119
  readonly ALREADY_SIGNALED: number;                              // 0x911A
  readonly TIMEOUT_EXPIRED: number;                               // 0x911B
  readonly CONDITION_SATISFIED: number;                           // 0x911C
  readonly WAIT_FAILED: number;                                   // 0x911D
  readonly SYNC_FLUSH_COMMANDS_BIT: number;                       // 0x00000001
  readonly VERTEX_ATTRIB_ARRAY_DIVISOR: number;                   // 0x88FE
  readonly ANY_SAMPLES_PASSED: number;                            // 0x8C2F
  readonly ANY_SAMPLES_PASSED_CONSERVATIVE: number;               // 0x8D6A
  readonly SAMPLER_BINDING: number;                               // 0x8919
  readonly RGB10_A2UI: number;                                    // 0x906F
  readonly INT_2_10_10_10_REV: number;                            // 0x8D9F
  readonly TRANSFORM_FEEDBACK: number;                            // 0x8E22
  readonly TRANSFORM_FEEDBACK_PAUSED: number;                     // 0x8E23
  readonly TRANSFORM_FEEDBACK_ACTIVE: number;                     // 0x8E24
  readonly TRANSFORM_FEEDBACK_BINDING: number;                    // 0x8E25
  readonly TEXTURE_IMMUTABLE_FORMAT: number;                      // 0x912F
  readonly MAX_ELEMENT_INDEX: number;                             // 0x8D6B
  readonly TEXTURE_IMMUTABLE_LEVELS: number;                      // 0x82DF

  readonly TIMEOUT_IGNORED: number;                               // -1

  /* WebGL-specific enums */
  readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;                 // 0x9247

  /* Buffer objects */
  // WebGL1:
  bufferData(target: number, sizeOrData: number | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array |
      Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null, usage: number): void;
  bufferSubData(target: number, dstByteOffset: number, srcData: Int8Array | Int16Array | Int32Array | Uint8Array |
      Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null): void;
  // For compatibility with WebGL 1 context in older Typescript versions.
  bufferData(target: number, data: ArrayBufferView, usage: number): void;
  bufferSubData(target: number, dstByteOffset: number, srcData: ArrayBufferView): void;
  // WebGL2:
  bufferData(target: number, srcData: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array |
      Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null, usage: number, srcOffset: number, length?: number): void;
  bufferSubData(target: number, dstByteOffset: number, srcData: ArrayBufferView,
      srcOffset: number, length?: number): void;

  copyBufferSubData(readTarget: number, writeTarget: number, readOffset: number,
      writeOffset: number, size: number): void;
  // MapBufferRange, in particular its read-only and write-only modes,
  // can not be exposed safely to JavaScript. GetBufferSubData
  // replaces it for the purpose of fetching data back from the GPU.
  getBufferSubData(target: number, srcByteOffset: number, dstBuffer: ArrayBufferView,
      dstOffset?: number, length?: number): void;

  /* Framebuffer objects */
  blitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number,
      dstX1: number, dstY1: number, mask: number, filter: number): void;
  framebufferTextureLayer(target: number, attachment: number, texture: WebGLTexture | null, level: number,
      layer: number): void;
  invalidateFramebuffer(target: number, attachments: number[]): void;
  invalidateSubFramebuffer(target: number, attachments: number[],
      x: number, y: number, width: number, height: number): void;
  readBuffer(src: number): void;

  /* Renderbuffer objects */
  getInternalformatParameter(target: number, internalformat: number, pname: number): any;
  renderbufferStorageMultisample(target: number, samples: number, internalformat: number,
      width: number, height: number): void;

  /* Texture objects */
  texStorage2D(target: number, levels: number, internalformat: number, width: number,
      height: number): void;
  texStorage3D(target: number, levels: number, internalformat: number, width: number,
      height: number, depth: number): void;

  // WebGL1 legacy entrypoints:
  texImage2D(target: number, level: number, internalformat: number,
      width: number, height: number, border: number, format: number,
      type: number, pixels?: ArrayBufferView | null): void;
  texImage2D(target: number, level: number, internalformat: number,
      format: number, type: number, source: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texImage2D(target: number, level: number, internalformat: number,
      format: number, type: number, source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException

  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      width: number, height: number,
      format: number, type: number, pixels?: ArrayBufferView | null): void;
  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      format: number, type: number, source: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      format: number, type: number, source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException

  // WebGL2 entrypoints:
  texImage2D(target: number, level: number, internalformat: number, width: number, height: number,
      border: number, format: number, type: number, pboOffset: number): void;
  texImage2D(target: number, level: number, internalformat: number, width: number, height: number,
      border: number, format: number, type: number,
      source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texImage2D(target: number, level: number, internalformat: number, width: number, height: number,
      border: number, format: number, type: number, srcData: ArrayBufferView,
      srcOffset: number): void;

  texImage3D(target: number, level: number, internalformat: number, width: number, height: number,
      depth: number, border: number, format: number, type: number, pboOffset: number): void;
  texImage3D(target: number, level: number, internalformat: number, width: number, height: number,
      depth: number, border: number, format: number, type: number,
      source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texImage3D(target: number, level: number, internalformat: number, width: number, height: number,
      depth: number, border: number, format: number, type: number, srcData: ArrayBufferView | null): void;
  texImage3D(target: number, level: number, internalformat: number, width: number, height: number,
      depth: number, border: number, format: number, type: number, srcData: ArrayBufferView,
      srcOffset: number): void;

  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number,
      height: number, format: number, type: number, pboOffset: number): void;
  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number,
      height: number, format: number, type: number,
      source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number,
      height: number, format: number, type: number, srcData: ArrayBufferView,
      srcOffset: number): void;

  texSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number,
      width: number, height: number, depth: number, format: number, type: number,
      pboOffset: number): void;
  texSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number,
      width: number, height: number, depth: number, format: number, type: number,
      source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void; // May throw DOMException
  texSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number,
      width: number, height: number, depth: number, format: number, type: number,
      srcData: ArrayBufferView | null, srcOffset?: number): void;

  copyTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number,
      x: number, y: number, width: number, height: number): void;

  compressedTexImage2D(target: number, level: number, internalformat: number, width: number,
      height: number, border: number, imageSize: number, offset: number): void;
  compressedTexImage2D(target: number, level: number, internalformat: number, width: number,
      height: number, border: number, srcData: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array |
      Uint8ClampedArray | Float32Array | Float64Array | DataView | null, srcOffset?: number, srcLengthOverride?: number): void;
  // For compatibility with WebGL 1 context in older Typescript versions.
  compressedTexImage2D(target: number, level: number, internalformat: number, width: number,
      height: number, border: number, srcData: ArrayBufferView,
      srcOffset?: number, srcLengthOverride?: number): void;

  compressedTexImage3D(target: number, level: number, internalformat: number, width: number,
      height: number, depth: number, border: number, imageSize: number, offset: number): void;
  compressedTexImage3D(target: number, level: number, internalformat: number, width: number,
      height: number, depth: number, border: number, srcData: ArrayBufferView,
      srcOffset?: number, srcLengthOverride?: number): void;

  compressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      width: number, height: number, format: number, imageSize: number, offset: number): void;
  compressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      width: number, height: number, format: number,
      srcData: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array |
      Uint8ClampedArray | Float32Array | Float64Array | DataView | null, srcOffset?: number, srcLengthOverride?: number): void;
  // For compatibility with WebGL 1 context in older Typescript versions.
  compressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number,
      width: number, height: number, format: number,
      srcData: ArrayBufferView | null,
      srcOffset?: number,
      srcLengthOverride?: number): void;

  compressedTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number,
      zoffset: number, width: number, height: number, depth: number,
      format: number, imageSize: number, offset: number): void;
  compressedTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number,
      zoffset: number, width: number, height: number, depth: number,
      format: number, srcData: ArrayBufferView,
      srcOffset?: number,
      srcLengthOverride?: number): void;

  /* Programs and shaders */
  getFragDataLocation(program: WebGLProgram, name: string): number;

  /* Uniforms */
  uniform1ui(location: WebGLUniformLocation | null, v0: number): void;
  uniform2ui(location: WebGLUniformLocation | null, v0: number, v1: number): void;
  uniform3ui(location: WebGLUniformLocation | null, v0: number, v1: number, v2: number): void;
  uniform4ui(location: WebGLUniformLocation | null, v0: number, v1: number, v2: number, v3: number): void;

  uniform1fv(location: WebGLUniformLocation | null, data: Float32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform2fv(location: WebGLUniformLocation | null, data: Float32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform3fv(location: WebGLUniformLocation | null, data: Float32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform4fv(location: WebGLUniformLocation | null, data: Float32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;

  uniform1iv(location: WebGLUniformLocation | null, data: Int32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform2iv(location: WebGLUniformLocation | null, data: Int32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform3iv(location: WebGLUniformLocation | null, data: Int32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform4iv(location: WebGLUniformLocation | null, data: Int32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;

  uniform1uiv(location: WebGLUniformLocation | null, data: Uint32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform2uiv(location: WebGLUniformLocation | null, data: Uint32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform3uiv(location: WebGLUniformLocation | null, data: Uint32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;
  uniform4uiv(location: WebGLUniformLocation | null, data: Uint32Array | ArrayLike<number>, srcOffset?: number,
      srcLength?: number): void;

  uniformMatrix2fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix3x2fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix4x2fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;

  uniformMatrix2x3fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix3fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix4x3fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;

  uniformMatrix2x4fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix3x4fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;
  uniformMatrix4fv(location: WebGLUniformLocation | null, transpose: boolean, data: Float32Array | ArrayLike<number>,
      srcOffset?: number, srcLength?: number): void;

  /* Vertex attribs */
  vertexAttribI4i(index: number, x: number, y: number, z: number, w: number): void;
  vertexAttribI4iv(index: number, values: Int32Array | ArrayLike<number>): void;
  vertexAttribI4ui(index: number, x: number, y: number, z: number, w: number): void;
  vertexAttribI4uiv(index: number, values: Uint32Array | ArrayLike<number>): void;
  vertexAttribIPointer(index: number, size: number, type: number, stride: number, offset: number): void;

  /* Writing to the drawing buffer */
  vertexAttribDivisor(index: number, divisor: number): void;
  drawArraysInstanced(mode: number, first: number, count: number, instanceCount: number): void;
  drawElementsInstanced(mode: number, count: number, type: number, offset: number, instanceCount: number): void;
  drawRangeElements(mode: number, start: number, end: number, count: number, type: number, offset: number): void;

  /* Reading back pixels */
  // WebGL1:
  readPixels(x: number, y: number, width: number, height: number, format: number, type: number,
      dstData: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray |
      Float32Array | Float64Array | DataView | null): void;
  // For compatibility with WebGL 1 context in older Typescript versions.
  readPixels(x: number, y: number, width: number, height: number, format: number, type: number,
      dstData: ArrayBufferView | null): void;
  // WebGL2:
  readPixels(x: number, y: number, width: number, height: number, format: number, type: number,
      offset: number): void;
  readPixels(x: number, y: number, width: number, height: number, format: number, type: number,
      dstData: ArrayBufferView, dstOffset: number): void;

  /* Multiple Render Targets */
  drawBuffers(buffers: number[]): void;

  clearBufferfv(buffer: number, drawbuffer: number, values: Float32Array | ArrayLike<number>,
      srcOffset?: number): void;
  clearBufferiv(buffer: number, drawbuffer: number, values: Int32Array | ArrayLike<number>,
      srcOffset?: number): void;
  clearBufferuiv(buffer: number, drawbuffer: number, values: Uint32Array | ArrayLike<number>,
      srcOffset?: number): void;

  clearBufferfi(buffer: number, drawbuffer: number, depth: number, stencil: number): void;

  /* Query Objects */
  createQuery(): WebGLQuery | null;
  deleteQuery(query: WebGLQuery | null): void;
  isQuery(query: WebGLQuery | null): boolean; //[WebGLHandlesContextLoss]
  beginQuery(target: number, query: WebGLQuery): void;
  endQuery(target: number): void;
  getQuery(target: number, pname: number): WebGLQuery | null;
  getQueryParameter(query: WebGLQuery, pname: number): any;

  /* Sampler Objects */
  createSampler(): WebGLSampler | null;
  deleteSampler(sampler: WebGLSampler | null): void;
  isSampler(sampler: WebGLSampler | null): boolean; //[WebGLHandlesContextLoss]
  bindSampler(unit: number, sampler: WebGLSampler | null): void;
  samplerParameteri(sampler: WebGLSampler, pname: number, param: number): void;
  samplerParameterf(sampler: WebGLSampler, pname: number, param: number): void;
  getSamplerParameter(sampler: WebGLSampler, pname: number): any;

  /* Sync objects */
  fenceSync(condition: number, flags: number): WebGLSync | null;
  isSync(sync: WebGLSync | null): boolean; //[WebGLHandlesContextLoss]
  deleteSync(sync: WebGLSync | null): void;
  clientWaitSync(sync: WebGLSync, flags: number, timeout: number): number;
  waitSync(sync: WebGLSync, flags: number, timeout: number): void;
  getSyncParameter(sync: WebGLSync, pname: number): any;

  /* Transform Feedback */
  createTransformFeedback(): WebGLTransformFeedback | null;
  deleteTransformFeedback(tf: WebGLTransformFeedback | null): void;
  isTransformFeedback(tf: WebGLTransformFeedback | null): boolean; //[WebGLHandlesContextLoss]
  bindTransformFeedback(target: number, tf: WebGLTransformFeedback | null): void;
  beginTransformFeedback(primitiveMode: number): void;
  endTransformFeedback(): void;
  transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number): void;
  getTransformFeedbackVarying(program: WebGLProgram, index: number): WebGLActiveInfo | null;
  pauseTransformFeedback(): void;
  resumeTransformFeedback(): void;

  /* Uniform Buffer Objects and Transform Feedback Buffers */
  bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null): void;
  bindBufferRange(target: number, index: number, buffer: WebGLBuffer | null, offset: number, size: number): void;
  getIndexedParameter(target: number, index: number): any;
  getUniformIndices(program: WebGLProgram, uniformNames: string[]): number[] | null;
  getActiveUniforms(program: WebGLProgram, uniformIndices: number[], pname: number): any;
  getUniformBlockIndex(program: WebGLProgram, uniformBlockName: string): number;
  getActiveUniformBlockParameter(program: WebGLProgram, uniformBlockIndex: number, pname: number): any;
  getActiveUniformBlockName(program: WebGLProgram, uniformBlockIndex: number): string | null;
  uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: number, uniformBlockBinding: number): void;

  /* Vertex Array Objects */
  createVertexArray(): WebGLVertexArrayObject | null;
  deleteVertexArray(vertexArray: WebGLVertexArrayObject | null): void;
  isVertexArray(vertexArray: WebGLVertexArrayObject | null): boolean; //[WebGLHandlesContextLoss]
  bindVertexArray(array: WebGLVertexArrayObject | null): void;
}

interface WebGLQuery extends WebGLObject {}
interface WebGLSampler extends WebGLObject {}
interface WebGLSync extends WebGLObject {}
interface WebGLTransformFeedback extends WebGLObject {}
interface WebGLVertexArrayObject extends WebGLObject {}
