// Script to compare images via HTTP server using Maestro's HTTP request capabilities
// NOTE do NOT use console.error, only console.log, as maestro always swallows console.error
// console.log is unfortunately swallowed too when using nested flows https://docs.maestro.dev/advanced/nested-flows
// and therefore the logs below are never shown
// also see "Logging with multiple arguments is not supported."
// https://docs.maestro.dev/advanced/javascript/logging#logging-in-a-separate-javascript-file

const SERVER_URL = 'http://localhost:3000';

function getParams() {
  /* eslint-disable no-undef */
  return {
    testID,
    similarityThreshold,
    diffOutputPath,
    baseImage,
    currentScreenshot,
    platform,
    mode,
    resizingFactor,
  };
  /* eslint-enable no-undef */
}

function compareImagesHttp() {
  try {
    const params = getParams();

    // eslint-disable-next-line no-undef
    const response = http.post(`${SERVER_URL}/process`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    // eslint-disable-next-line no-undef
    return json(response.body);
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

// eslint-disable-next-line no-undef
output.comparisonResult = comparisonResult;
