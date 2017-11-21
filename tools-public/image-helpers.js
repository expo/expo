const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function resizeIconWithSharpAsync(iconSizePx, iconFilename, destinationIconPath) {
  const filename = path.join(destinationIconPath, iconFilename);

  // sharp can't have same input and output filename, so load to buffer then
  // write to disk after resize is complete
  let buffer = await sharp(filename)
    .resize(iconSizePx, iconSizePx)
    .toBuffer();

  fs.writeFileSync(filename, buffer);
}

async function getImageDimensionsWithSharpAsync(basename, dirname) {
  const filename = path.join(dirname, basename);

  try {
    let meta = await sharp(filename).metadata();
    return [meta.width, meta.height];
  } catch(e) {
    return null;
  }
}

module.exports = {
  resizeIconWithSharpAsync,
  getImageDimensionsWithSharpAsync,
};
