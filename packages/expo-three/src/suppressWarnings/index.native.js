const suppressExpoWarnings = (shouldSuppress = true) => {
  if (shouldSuppress) {
    global.__expo_three_oldWarn = global.__expo_three_oldWarn || console.warn;
    global.console.warn = str => {
      let tst = (str || '') + '';
      if (
        tst.startsWith('THREE.WebGLRenderer:') ||
        tst.startsWith('THREE.WebGLShader: gl.getShader') ||
        tst.startsWith('THREE.Matrix4: .getInverse()') ||
        tst.startsWith('THREE.Matrix3: .getInverse()')
      ) {
        // don't provide stack traces for warnspew from THREE
        console.log('Warning:', str);
        return;
      }
      return global.__expo_three_oldWarn.apply(console, [str]);
    };
  } else {
    console.warn = global.__expo_three_oldWarn;
  }
};

export default suppressExpoWarnings;
