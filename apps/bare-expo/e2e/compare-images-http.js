// Script to compare images via HTTP server using Maestro's HTTP request capabilities
// Uses global.baseImageParam and global.currentScreenshotParam for image paths
// do NOT use console.error, only console.log

const SERVER_URL = 'http://localhost:3000';

function compareImagesHttp() {
  try {
    // Get image paths from global variables
    const outputPathParam = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
    const baseImageParam = baseImage.endsWith('.png') ? baseImage : `${baseImage}.png`;
    const currentScreenshotParam = currentScreenshot.endsWith('.png')
      ? currentScreenshot
      : `${currentScreenshot}.png`;

    if (!baseImageParam || !currentScreenshotParam) {
      console.log(
        'Missing image paths. Expected env.baseImageParam and env.currentScreenshotParam'
      );
      console.log('baseImageParam:', baseImageParam);
      console.log('currentScreenshotParam:', currentScreenshotParam);
      return false;
    }

    console.log('Comparing images:');
    console.log('  Base image:', baseImageParam);
    console.log('  Current screenshot:', currentScreenshotParam);

    const response = http.post(`${SERVER_URL}/compare`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image1: baseImageParam,
        image2: currentScreenshotParam,
        outputPath: outputPathParam,
      }),
    });

    const result = json(response.body);

    if (response.ok) {
      return result;
    } else if (response.status === 400) {
      console.log('❌ Images are too different');
    } else {
      console.log('Server status:', response.status);
    }
    console.log('result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    const errorMessage = error?.message || error;
    console.log('Failed to compare images:', errorMessage);
    return {
      error: error.message,
      success: false,
    };
  }
}

const comparisonResult = compareImagesHttp();

output.comparisonResult = comparisonResult;
