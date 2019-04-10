const resemble = require('node-resemble-js');
const fs = require('fs-extra');

// https://github.com/burnpiro/puppeteer-screenshot-tester/blob/master/src/index.js
async function compareImagesAsync({ currentImageBuffer, outputFolder, fileName, ext = '.png' }) {
  return new Promise(async (resolve, reject) => {
    const originalImageBuffer = await getOriginalImageBufferAsync(outputFolder, fileName, ext);
    const includeAA = false;
    const ignoreColors = false;
    const ignoreRectangles = [];
    const saveNewImageOnError = false;
    const threshold = 0;
    if (originalImageBuffer !== undefined) {
      // call comparison between images
      const comparisonResult = resemble(currentImageBuffer).compareTo(originalImageBuffer);

      // Add extra options if specified
      if (!includeAA) {
        comparisonResult.ignoreAntialiasing();
      }
      if (ignoreColors) {
        comparisonResult.ignoreColors();
      }
      if (ignoreRectangles.length > 0) {
        comparisonResult.ignoreRectangles(ignoreRectangles);
      }

      // await for a comparison to be completed and return resolved value
      comparisonResult.onComplete(data => {
        // check if images are the same dimensions and mismatched pixels are below threshold
        if (data.isSameDimensions === false || Number(data.misMatchPercentage) > threshold) {
          // optionally save the new image to the test directory
          if (saveNewImageOnError) {
            fs.writeFileSync(`${outputFolder}/${fileName}-new${ext}`, currentImageBuffer);
          }

          reject(new Error(`${fileName} did not match snapshot`));
        } else {
          resolve(true);
        }
      });
    } else {
      // if there is no old image we cannot compare two images so just write existing screenshot as default image
      fs.writeFileSync(`${outputFolder}/${fileName}${ext}`, currentImageBuffer);
      console.log('There was nothing to compare, current screens saved as default');
      resolve(true);
    }
  });
}

// returns promise which resolves with undefined or PNG object
function getOriginalImageBufferAsync(folderPath, name = 'test', ext = 'png') {
  return new Promise(resolve => {
    fs.stat(`${folderPath}/${name}${ext}`, error => {
      if (error) {
        // if there is an error resolve with undefined
        resolve();
      } else {
        // if file exists just get file and pipe it into PNG
        fs.readFile(`${folderPath}/${name}${ext}`, (err, data) => {
          if (err || !(data instanceof Buffer)) {
            resolve();
          } else {
            resolve(data);
          }
        });
      }
    });
  });
}

module.exports = {
  compareImagesAsync,
  getOriginalImageBufferAsync,
};
