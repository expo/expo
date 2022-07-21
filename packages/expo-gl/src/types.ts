// WebGLObject was removed from lib.dom.ts in v4.2 - copied from the old lib.dom.ts
// ref: https://github.com/microsoft/TypeScript/blob/bc76e7f03c6a80706246f7c35e392bfc88a93ac3/lib/lib.dom.d.ts#L17355-L17361
/**
 * @hidden
 */
export interface WebGLObject {}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare let WebGLObject: {
  prototype: WebGLObject;
  new (): WebGLObject;
};
