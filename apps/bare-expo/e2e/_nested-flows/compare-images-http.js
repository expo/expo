// Script to compare images via HTTP server using Maestro's HTTP request capabilities
// NOTE do NOT use console.error, only console.log, as maestro always swallows console.error
// console.log is unfortunately swallowed too when using nested flows https://docs.maestro.dev/advanced/nested-flows
// and therefore the logs below are never shown
// also see "Logging with multiple arguments is not supported."
// https://docs.maestro.dev/advanced/javascript/logging#logging-in-a-separate-javascript-file

const SERVER_URL = 'http://localhost:3000';

function getParams() {
  /* eslint-disable no-undef */
  // we need to do some pre-processing on some values, validation happens later on the server-side
  const testIDparam = typeof testID === 'string' && testID !== 'undefined' ? testID : undefined;
  const similarityThresholdParam = Number.isFinite(similarityThreshold)
    ? Number(similarityThreshold)
    : undefined;
  return {
    testID: testIDparam,
    similarityThreshold: similarityThresholdParam,
    diffOutputPath: outputPath,
    baseImage,
    currentScreenshot,
    platform,
    mode,
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

// eslint-disable-next-line no-undef
output.comparisonResult = comparisonResult;
