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
    const testIDparam = typeof testID === 'string' && testID !== 'undefined' ? testID : undefined;
    const similarityThresholdParam = Number.isFinite(similarityThreshold)
      ? Number(similarityThreshold)
      : undefined;

    const response = http.post(`${SERVER_URL}/process`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseImage,
        currentScreenshot,
        similarityThreshold: similarityThresholdParam,
        diffOutputPath: outputPath,
        testID: testIDparam,
        platform,
        mode,
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
