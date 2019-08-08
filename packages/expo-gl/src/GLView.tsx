import * as React from 'react';
import PropTypes from 'prop-types';
import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import { Platform, View, ViewPropTypes, findNodeHandle } from 'react-native';

const packageJSON = require('../package.json');

import { SurfaceCreateEvent, GLSnapshot, ExpoWebGLRenderingContext, SnapshotOptions, BaseGLViewProps } from './GLView.types';
import { UnavailabilityError } from '@unimodules/core';

declare let global: any;

const { ExponentGLObjectManager, ExponentGLViewManager } = NativeModulesProxy;


type GLViewProps = {

  /**
  * Called when the OpenGL context is created, with the context object as a parameter. The context
  * object has an API mirroring WebGL's WebGLRenderingContext.
  */
 onContextCreate(gl: ExpoWebGLRenderingContext): void;

 /**
  * [iOS only] Number of samples for Apple's built-in multisampling.
  */
 msaaSamples: number;

 /**
  * A ref callback for the native GLView
  */
 nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | null);
} & BaseGLViewProps;

type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>;
const NativeView = requireNativeViewManager('ExponentGLView');

/**
 * A component that acts as an OpenGL render target
 */
export class GLView extends React.Component<GLViewProps> {
  static NativeView: any;
  static propTypes = {
    onContextCreate: PropTypes.func,
    msaaSamples: PropTypes.number,
    nativeRef_EXPERIMENTAL: PropTypes.func,
    ...ViewPropTypes,
  };

  static defaultProps = {
    msaaSamples: 4,
  };

  static async createContextAsync(): Promise<ExpoWebGLRenderingContext> {
    const { exglCtxId } = await ExponentGLObjectManager.createContextAsync();
    return getGl(exglCtxId);
  }

  static async destroyContextAsync(exgl?: ExpoWebGLRenderingContext | number): Promise<boolean> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.destroyContextAsync(exglCtxId);
  }

  static async takeSnapshotAsync(
    exgl?: ExpoWebGLRenderingContext | number,
    options: SnapshotOptions = {}
  ): Promise<GLSnapshot> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.takeSnapshotAsync(exglCtxId, options);
  }

  nativeRef: ComponentOrHandle = null;
  exglCtxId?: number;

  render() {
    const {
      onContextCreate, // eslint-disable-line no-unused-vars
      msaaSamples,
      ...viewProps
    } = this.props;

    return (
      <View {...viewProps}>
        <NativeView
          ref={this._setNativeRef}
          style={{
            flex: 1,
            ...(Platform.OS === 'ios'
              ? {
                  backgroundColor: 'transparent',
                }
              : {}),
          }}
          onSurfaceCreate={this._onSurfaceCreate}
          msaaSamples={Platform.OS === 'ios' ? msaaSamples : undefined}
        />
      </View>
    );
  }

  _setNativeRef = (nativeRef: ComponentOrHandle): void => {
    if (this.props.nativeRef_EXPERIMENTAL) {
      this.props.nativeRef_EXPERIMENTAL(nativeRef);
    }
    this.nativeRef = nativeRef;
  };

  _onSurfaceCreate = ({ nativeEvent: { exglCtxId } }: SurfaceCreateEvent): void => {
    const gl = getGl(exglCtxId);

    this.exglCtxId = exglCtxId;

    if (this.props.onContextCreate) {
      this.props.onContextCreate(gl);
    }
  };

  async startARSessionAsync(): Promise<any> {
    if (!ExponentGLViewManager.startARSessionAsync) {
      throw new UnavailabilityError('expo-gl', 'startARSessionAsync')
    }
    return await ExponentGLViewManager.startARSessionAsync(findNodeHandle(this.nativeRef));
  }

  async createCameraTextureAsync(cameraRefOrHandle: ComponentOrHandle): Promise<WebGLTexture> {
    if (!ExponentGLObjectManager.createCameraTextureAsync) {
      throw new UnavailabilityError('expo-gl', 'createCameraTextureAsync')
    }

    const { exglCtxId } = this;

    if (!exglCtxId) {
      throw new Error("GLView's surface is not created yet!");
    }

    const cameraTag = findNodeHandle(cameraRefOrHandle);
    const { exglObjId } = await ExponentGLObjectManager.createCameraTextureAsync(
      exglCtxId,
      cameraTag
    );
    return new WebGLTexture(exglObjId);
  }

  async destroyObjectAsync(glObject: WebGLObject): Promise<boolean> {
    if (!ExponentGLObjectManager.destroyObjectAsync) {
      throw new UnavailabilityError('expo-gl', 'destroyObjectAsync')
    }
    return await ExponentGLObjectManager.destroyObjectAsync(glObject.id);
  }

  async takeSnapshotAsync(options: SnapshotOptions = {}): Promise<GLSnapshot> {
    if (!GLView.takeSnapshotAsync) {
      throw new UnavailabilityError('expo-gl', 'takeSnapshotAsync')
    }
    const { exglCtxId } = this;
    return await GLView.takeSnapshotAsync(exglCtxId, options);
  }
}

GLView.NativeView = NativeView;

// JavaScript WebGL types to wrap around native objects

class WebGLRenderingContext {
  __exglCtxId?: number;
}

class WebGL2RenderingContext extends WebGLRenderingContext {}

type WebGLObjectId = any;

const idToObject = {};

class WebGLObject {
  id: WebGLObjectId;

  constructor(id: WebGLObjectId) {
    if (idToObject[id]) {
      throw new Error(`WebGL object with underlying EXGLObjectId '${id}' already exists!`);
    }
    this.id = id; // Native GL object id
  }
  toString() {
    return `[WebGLObject ${this.id}]`;
  }
}

const wrapObject = (type, id: WebGLObjectId) => {
  const found = idToObject[id];
  if (found) {
    return found;
  }
  return (idToObject[id] = new type(id));
};

const objectId = (obj: WebGLObject) => obj && obj.id;

class WebGLBuffer extends WebGLObject {}

class WebGLFramebuffer extends WebGLObject {}

class WebGLProgram extends WebGLObject {}

class WebGLRenderbuffer extends WebGLObject {}

class WebGLShader extends WebGLObject {}

class WebGLTexture extends WebGLObject {}

class WebGLUniformLocation {
  id: WebGLObjectId;

  constructor(id: WebGLObjectId) {
    this.id = id; // Native GL object id
  }
}

class WebGLActiveInfo {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

class WebGLShaderPrecisionFormat {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

// WebGL2 classes
class WebGLQuery extends WebGLObject {}

class WebGLSampler extends WebGLObject {}

class WebGLSync extends WebGLObject {}

class WebGLTransformFeedback extends WebGLObject {}

class WebGLVertexArrayObject extends WebGLObject {}

// Many functions need wrapping/unwrapping of arguments and return value. We handle each case
// specifically so we can write the tightest code for better performance.
const wrapMethods = gl => {
  const wrap = (methodNames, wrapper) =>
    (Array.isArray(methodNames) ? methodNames : [methodNames]).forEach(
      methodName => (gl[methodName] = wrapper(gl[methodName]))
    );

  // We can be slow in `gl.getParameter(...)` since it's a blocking call anyways
  const getParameterTypes = {
    [gl.ARRAY_BUFFER_BINDING]: WebGLBuffer,
    [gl.COPY_READ_BUFFER_BINDING]: WebGLBuffer,
    [gl.COPY_WRITE_BUFFER_BINDING]: WebGLBuffer,
    [gl.CURRENT_PROGRAM]: WebGLProgram,
    [gl.DRAW_FRAMEBUFFER_BINDING]: WebGLFramebuffer,
    [gl.ELEMENT_ARRAY_BUFFER_BINDING]: WebGLBuffer,
    [gl.READ_FRAMEBUFFER_BINDING]: WebGLFramebuffer,
    [gl.RENDERBUFFER_BINDING]: WebGLRenderbuffer,
    [gl.SAMPLER_BINDING]: WebGLSampler,
    [gl.TEXTURE_BINDING_2D_ARRAY]: WebGLTexture,
    [gl.TEXTURE_BINDING_2D]: WebGLTexture,
    [gl.TEXTURE_BINDING_3D]: WebGLTexture,
    [gl.TEXTURE_BINDING_CUBE_MAP]: WebGLTexture,
    [gl.TRANSFORM_FEEDBACK_BINDING]: WebGLTransformFeedback,
    [gl.TRANSFORM_FEEDBACK_BUFFER_BINDING]: WebGLBuffer,
    [gl.UNIFORM_BUFFER_BINDING]: WebGLBuffer,
    [gl.VERTEX_ARRAY_BINDING]: WebGLVertexArrayObject,
  };
  wrap('getParameter', orig => pname => {
    let ret = orig.call(gl, pname);
    if (pname === gl.VERSION) {
      // Wrap native version name
      ret = `WebGL 2.0 (Expo-${Platform.OS}-${packageJSON.version}) (${ret})`;
    }
    const type = getParameterTypes[pname];
    return type ? wrapObject(type, ret) : ret;
  });

  // Buffers
  wrap('bindBuffer', orig => (target, buffer) => orig.call(gl, target, buffer && buffer.id));
  wrap('createBuffer', orig => () => wrapObject(WebGLBuffer, orig.call(gl)));
  wrap('deleteBuffer', orig => buffer => orig.call(gl, buffer && buffer.id));
  wrap('isBuffer', orig => buffer => buffer instanceof WebGLBuffer && orig.call(gl, buffer.id));

  // Framebuffers
  wrap('bindFramebuffer', orig => (target, framebuffer) =>
    orig.call(gl, target, framebuffer && framebuffer.id)
  );
  wrap('createFramebuffer', orig => () => wrapObject(WebGLFramebuffer, orig.call(gl)));
  wrap('deleteFramebuffer', orig => framebuffer => orig.call(gl, framebuffer && framebuffer.id));
  wrap('framebufferRenderbuffer', orig => (target, attachment, rbtarget, rb) =>
    orig.call(gl, target, attachment, rbtarget, rb && rb.id)
  );
  wrap('framebufferTexture2D', orig => (target, attachment, textarget, tex, level) =>
    orig.call(gl, target, attachment, textarget, tex && tex.id, level)
  );
  wrap('isFramebuffer', orig => framebuffer =>
    framebuffer instanceof WebGLFramebuffer && orig.call(gl, framebuffer.id)
  );
  wrap('framebufferTextureLayer', orig => (target, attachment, texture, level, layer) => {
    return orig.call(gl, target, attachment, objectId(texture), level, layer);
  });

  // Renderbuffers
  wrap('bindRenderbuffer', orig => (target, renderbuffer) =>
    orig.call(gl, target, renderbuffer && renderbuffer.id)
  );
  wrap('createRenderbuffer', orig => () => wrapObject(WebGLRenderbuffer, orig.call(gl)));
  wrap('deleteRenderbuffer', orig => renderbuffer =>
    orig.call(gl, renderbuffer && renderbuffer.id)
  );
  wrap('isRenderbuffer', orig => renderbuffer =>
    renderbuffer instanceof WebGLRenderbuffer && orig.call(gl, renderbuffer.id)
  );

  // Textures
  wrap('bindTexture', orig => (target, texture) => orig.call(gl, target, texture && texture.id));
  wrap('createTexture', orig => () => wrapObject(WebGLTexture, orig.call(gl)));
  wrap('deleteTexture', orig => texture => orig.call(gl, texture && texture.id));
  wrap('isTexture', orig => texture =>
    texture instanceof WebGLTexture && orig.call(gl, texture.id)
  );

  // Programs and shaders
  wrap('attachShader', orig => (program, shader) =>
    orig.call(gl, program && program.id, shader && shader.id)
  );
  wrap('bindAttribLocation', orig => (program, index, name) =>
    orig.call(gl, program && program.id, index, name)
  );
  wrap('compileShader', orig => shader => orig.call(gl, shader && shader.id));
  wrap('createProgram', orig => () => wrapObject(WebGLProgram, orig.call(gl)));
  wrap('createShader', orig => type => wrapObject(WebGLShader, orig.call(gl, type)));
  wrap('deleteProgram', orig => program => orig.call(gl, program && program.id));
  wrap('deleteShader', orig => shader => orig.call(gl, shader && shader.id));
  wrap('detachShader', orig => (program, shader) =>
    orig.call(gl, program && program.id, shader && shader.id)
  );
  wrap('getAttachedShaders', orig => program =>
    orig.call(gl, program && program.id).map(id => wrapObject(WebGLShader, id))
  );
  wrap('getProgramParameter', orig => (program, pname) =>
    orig.call(gl, program && program.id, pname)
  );
  wrap('getProgramInfoLog', orig => program => orig.call(gl, program && program.id));
  wrap('getShaderParameter', orig => (shader, pname) => orig.call(gl, shader && shader.id, pname));
  wrap('getShaderPrecisionFormat', orig => (shadertype, precisiontype) =>
    new WebGLShaderPrecisionFormat(orig.call(gl, shadertype, precisiontype))
  );
  wrap('getShaderInfoLog', orig => shader => orig.call(gl, shader && shader.id));
  wrap('getShaderSource', orig => shader => orig.call(gl, shader && shader.id));
  wrap('linkProgram', orig => program => orig.call(gl, program && program.id));
  wrap('shaderSource', orig => (shader, source) => orig.call(gl, shader && shader.id, source));
  wrap('useProgram', orig => program => orig.call(gl, program && program.id));
  wrap('validateProgram', orig => program => orig.call(gl, program && program.id));
  wrap('isShader', orig => shader => shader instanceof WebGLShader && orig.call(gl, shader.id));
  wrap('isProgram', orig => program =>
    program instanceof WebGLProgram && orig.call(gl, program.id)
  );
  wrap('getFragDataLocation', orig => program => orig.call(gl, objectId(program)));

  // Uniforms and attributes
  wrap('getActiveAttrib', orig => (program, index) =>
    new WebGLActiveInfo(orig.call(gl, program && program.id, index))
  );
  wrap('getActiveUniform', orig => (program, index) =>
    new WebGLActiveInfo(orig.call(gl, program && program.id, index))
  );
  wrap('getAttribLocation', orig => (program, name) => orig.call(gl, program && program.id, name));
  wrap('getUniform', orig => (program, location) =>
    orig.call(gl, program && program.id, location && location.id)
  );
  wrap('getUniformLocation', orig => (program, name) =>
    new WebGLUniformLocation(orig.call(gl, program && program.id, name))
  );
  wrap(['uniform1f', 'uniform1i', 'uniform1ui'], orig => (loc, x) =>
    orig.call(gl, objectId(loc), x)
  );
  wrap(['uniform2f', 'uniform2i', 'uniform2ui'], orig => (loc, x, y) =>
    orig.call(gl, objectId(loc), x, y)
  );
  wrap(['uniform3f', 'uniform3i', 'uniform3ui'], orig => (loc, x, y, z) =>
    orig.call(gl, objectId(loc), x, y, z)
  );
  wrap(['uniform4f', 'uniform4i', 'uniform4ui'], orig => (loc, x, y, z, w) =>
    orig.call(gl, objectId(loc), x, y, z, w)
  );
  wrap(['uniform1fv', 'uniform2fv', 'uniform3fv', 'uniform4fv'], orig => (loc, val) =>
    orig.call(gl, objectId(loc), new Float32Array(val))
  );
  wrap(['uniform1iv', 'uniform2iv', 'uniform3iv', 'uniform4iv'], orig => (loc, val) =>
    orig.call(gl, objectId(loc), new Int32Array(val))
  );
  wrap(['uniform1uiv', 'uniform2uiv', 'uniform3uiv', 'uniform4uiv'], orig => (loc, val) =>
    orig.call(gl, objectId(loc), new Uint32Array(val))
  );
  wrap(
    [
      'uniformMatrix2fv',
      'uniformMatrix3fv',
      'uniformMatrix4fv',
      'uniformMatrix3x2fv',
      'uniformMatrix4x2fv',
      'uniformMatrix2x3fv',
      'uniformMatrix4x3fv',
      'uniformMatrix2x4fv',
      'uniformMatrix3x4fv',
    ],
    orig => (loc, transpose, val) => orig.call(gl, loc && loc.id, transpose, new Float32Array(val))
  );
  wrap(
    ['vertexAttrib1fv', 'vertexAttrib2fv', 'vertexAttrib3fv', 'vertexAttrib4fv'],
    orig => (index, val) => orig.call(gl, index, new Float32Array(val))
  );
  wrap('vertexAttribI4iv', orig => (index, val) => orig.call(gl, index, new Int32Array(val)));
  wrap('vertexAttribI4uiv', orig => (index, val) => orig.call(gl, index, new Uint32Array(val)));

  // Query objects
  wrap('createQuery', orig => () => wrapObject(WebGLQuery, orig.call(gl)));
  wrap('deleteQuery', orig => query => orig.call(gl, objectId(query)));
  wrap('beginQuery', orig => (target, query) => orig.call(gl, target, objectId(query)));
  wrap('getQuery', orig => (target, pname) => {
    const id = orig.call(gl, target, pname);
    return id ? wrapObject(WebGLQuery, id) : id;
  });
  wrap('getQueryParameter', orig => (query, pname) => orig.call(gl, objectId(query), pname));

  // Samplers
  wrap('bindSampler', orig => (unit, sampler) => orig.call(gl, unit, objectId(sampler)));
  wrap('createSampler', orig => () => wrapObject(WebGLSampler, orig.call(gl)));
  wrap('deleteSampler', orig => sampler => orig.call(gl, objectId(sampler)));
  wrap('isSampler', orig => sampler =>
    sampler instanceof WebGLSampler && orig.call(gl, sampler.id)
  );
  wrap(['samplerParameteri', 'samplerParameterf'], orig => (sampler, pname, param) => {
    return orig.call(gl, objectId(sampler), pname, param);
  });
  wrap('getSamplerParameter', orig => (sampler, pname) => {
    return orig.call(gl, objectId(sampler), pname);
  });

  // Transform feedback
  wrap('bindTransformFeedback', orig => (target, transformFeedback) => {
    return orig.call(gl, target, objectId(transformFeedback));
  });
  wrap('createTransformFeedback', orig => () => wrapObject(WebGLTransformFeedback, orig.call(gl)));
  wrap('deleteTransformFeedback', orig => transformFeedback => {
    return orig.call(gl, objectId(transformFeedback));
  });
  wrap('transformFeedbackVaryings', orig => (program, varyings, bufferMode) => {
    return orig.call(gl, objectId(program), varyings, bufferMode);
  });
  wrap('getTransformFeedbackVarying', orig => (program, index) => {
    return new WebGLActiveInfo(orig.call(gl, objectId(program), index));
  });

  // Uniforms and attributes
  wrap(['bindBufferBase', 'bindBufferRange'], orig => (target, index, buffer, ...rest) => {
    return orig.call(gl, target, index, objectId(buffer), ...rest);
  });
  wrap('getUniformIndices', orig => (program, uniformNames) => {
    // according to WebGL2 specs, it returns Array instead of Uint32Array
    const uintArray = orig.call(gl, objectId(program), uniformNames);
    return Array.from(uintArray);
  });
  wrap('getActiveUniforms', orig => (program, uniformIndices, pname) => {
    // according to WebGL2 specs, it returns Array instead of Int32Array
    const intArray = orig.call(gl, objectId(program), new Uint32Array(uniformIndices), pname);
    const boolResult = pname === gl.UNIFORM_IS_ROW_MAJOR;
    const arr = Array.from(intArray);
    return boolResult ? arr.map(val => !!val) : arr;
  });
  wrap('getUniformBlockIndex', orig => (program, uniformBlockName) =>
    orig.call(gl, objectId(program), uniformBlockName)
  );
  wrap('getActiveUniformBlockName', orig => (program, uniformBlockIndex) =>
    orig.call(gl, objectId(program), uniformBlockIndex)
  );
  wrap('uniformBlockBinding', orig => (program, uniformBlockIndex, uniformBlockBinding) => {
    return orig.call(gl, objectId(program), uniformBlockIndex, uniformBlockBinding);
  });

  // Vertex array objects
  wrap('bindVertexArray', orig => vertexArray => orig.call(gl, vertexArray && vertexArray.id));
  wrap('createVertexArray', orig => () => wrapObject(WebGLVertexArrayObject, orig.call(gl)));
  wrap('deleteVertexArray', orig => vertexArray => orig.call(gl, vertexArray && vertexArray.id));
  wrap('isVertexArray', orig => vertexArray =>
    vertexArray instanceof WebGLVertexArrayObject && orig.call(gl, vertexArray.id)
  );
};

// Get the GL interface from an EXGLContextID and do JS-side setup
const getGl = (exglCtxId: number): ExpoWebGLRenderingContext => {
  const gl = global.__EXGLContexts[exglCtxId];
  gl.__exglCtxId = exglCtxId;
  delete global.__EXGLContexts[exglCtxId];

  // determine the prototype to use, depending on OpenGL ES version
  const glesVersion = gl.getParameter(gl.VERSION);
  const supportsWebGL2 = parseFloat(glesVersion.split(/[^\d.]+/g).join(' ')) >= 3.0;
  const prototype = supportsWebGL2
    ? global.WebGL2RenderingContext.prototype
    : global.WebGLRenderingContext.prototype;

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(gl, prototype);
  } else {
    // Delete this path when we are competely sure we're using modern JSC on Android. iOS 9+
    // supports Object.setPrototypeOf.
    gl.__proto__ = prototype; // eslint-disable-line no-proto
  }

  wrapMethods(gl);

  // No canvas yet...
  gl.canvas = null;

  // Drawing buffer width/height
  // TODO(nikki): Make this dynamic
  const viewport = gl.getParameter(gl.VIEWPORT);
  gl.drawingBufferWidth = viewport[2];
  gl.drawingBufferHeight = viewport[3];

  // Enable/disable logging of all GL function calls
  let enableLogging = false;

  // $FlowIssue: Flow wants a "value" field
  Object.defineProperty(gl, 'enableLogging', {
    configurable: true,
    get(): boolean {
      return enableLogging;
    },
    set(enable: boolean): void {
      if (enable === enableLogging) {
        return;
      }
      if (enable) {
        Object.keys(gl).forEach(key => {
          if (typeof gl[key] === 'function') {
            const original = gl[key];
            gl[key] = (...args) => {
              console.log(`EXGL: ${key}(${args.join(', ')})`);
              const r = original.apply(gl, args);
              console.log(`EXGL:    = ${r}`);
              return r;
            };
            gl[key].original = original;
          }
        });
      } else {
        Object.keys(gl).forEach(key => {
          if (typeof gl[key] === 'function' && gl[key].original) {
            gl[key] = gl[key].original;
          }
        });
      }
      enableLogging = enable;
    },
  });

  return gl;
};

const getContextId = (exgl?: ExpoWebGLRenderingContext | number): number => {
  const exglCtxId = exgl && typeof exgl === 'object' ? exgl.__exglCtxId : exgl;

  if (!exglCtxId || typeof exglCtxId !== 'number') {
    throw new Error(`Invalid EXGLContext id: ${String(exglCtxId)}`);
  }
  return exglCtxId;
};

global.WebGLRenderingContext = WebGLRenderingContext;
global.WebGL2RenderingContext = WebGL2RenderingContext;
global.WebGLObject = WebGLObject;
global.WebGLBuffer = WebGLBuffer;
global.WebGLFramebuffer = WebGLFramebuffer;
global.WebGLProgram = WebGLProgram;
global.WebGLRenderbuffer = WebGLRenderbuffer;
global.WebGLShader = WebGLShader;
global.WebGLTexture = WebGLTexture;
global.WebGLUniformLocation = WebGLUniformLocation;
global.WebGLActiveInfo = WebGLActiveInfo;
global.WebGLShaderPrecisionFormat = WebGLShaderPrecisionFormat;
global.WebGLQuery = WebGLQuery;
global.WebGLSampler = WebGLSampler;
global.WebGLSync = WebGLSync;
global.WebGLTransformFeedback = WebGLTransformFeedback;
global.WebGLVertexArrayObject = WebGLVertexArrayObject;
