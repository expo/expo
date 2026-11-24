const { optimize } = require('svgo');

const PATH_DATA = /\bd:\s*"([^"]+)"/g;

function optimizePathData(pathData) {
  const { data } = optimize(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}"/></svg>`,
    {
      plugins: [{ name: 'convertPathData', params: { floatPrecision: 2, makeArcs: false } }],
    }
  );
  return data.match(/ d="([^"]*)"/)[1];
}

module.exports = function optimizeIconPathsLoader(source) {
  return source.replace(PATH_DATA, (_, pathData) => `d:"${optimizePathData(pathData)}"`);
};
