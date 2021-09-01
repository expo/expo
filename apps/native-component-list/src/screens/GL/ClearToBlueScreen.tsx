import GLWrap from './GLWrap';

export default GLWrap('Clear to blue', async (gl) => {
  gl.clearColor(0, 0, 1, 1);
  // tslint:disable-next-line: no-bitwise
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.endFrameEXP();
});
