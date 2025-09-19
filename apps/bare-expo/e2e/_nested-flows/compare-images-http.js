/* eslint-disable no-undef */
// there are a few maestro global variables that are used, hence the eslint-disable

// Script to compare images via HTTP server using Maestro's HTTP request capabilities
// NOTE do NOT use console.error, only console.log, as maestro always swallows console.error
// console.log is unfortunately swallowed too when using nested flows https://docs.maestro.dev/advanced/nested-flows
// and therefore the logs below are never shown
// also see "Logging with multiple arguments is not supported."
// https://docs.maestro.dev/advanced/javascript/logging#logging-in-a-separate-javascript-file

const SERVER_URL = 'http://localhost:3000';

function compareImagesHttp() {
  try {
    // Get image paths and similarity threshold from global variables
    const outputPathParam = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
    const baseImageParam = baseImage.endsWith('.png') ? baseImage : `${baseImage}.png`;
    const currentScreenshotParam = currentScreenshot.endsWith('.png')
      ? currentScreenshot
      : `${currentScreenshot}.png`;
    const thresholdParam = typeof similarityThreshold === 'number' ? similarityThreshold : 5;

    if (!baseImageParam || !currentScreenshotParam) {
      const message = `Missing image paths. Expected env.baseImageParam (${String(baseImageParam)} and env.currentScreenshotParam (${String(currentScreenshotParam)})`;
      console.log(message);
      return {
        error: message,
        success: false,
      };
    }

    const response = http.post(`${SERVER_URL}/compare`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image1: baseImageParam,
        image2: currentScreenshotParam,
        outputPath: outputPathParam,
        similarityThreshold: thresholdParam,
      }),
    });

    const result = json(response.body);

    if (response.ok) {
      return result;
    } else if (response.status === 400) {
      console.log('❌ Images are too different');
    } else {
      console.log(`Server status: ${response.status}`);
    }
    console.log(`result: ${JSON.stringify(result, null, 2)}`);

    return result;
  } catch (error) {
    const errorMessage = error?.message || error;
    console.log(`Failed to compare images: ${errorMessage}`);
    return {
      error: errorMessage,
      success: false,
    };
  }
}

const comparisonResult = compareImagesHttp();

output.comparisonResult = comparisonResult;
