import * as fs from 'fs';
import * as os from 'os';
import path from 'path';

import { RequestBody } from '../../e2e/_nested-flows/schema';

const pngSuffix = '.png';

export const transformPaths = (e2eDir: string, parsedBody: RequestBody, homeDir?: string) => {
  const { baseImage, currentScreenshot, platform, diffOutputPath } = parsedBody;
  const testID = 'testID' in parsedBody ? parsedBody.testID : undefined;
  const mode = 'mode' in parsedBody ? parsedBody.mode : undefined;

  const currentScreenshotPath = path.resolve(e2eDir, currentScreenshot + pngSuffix);

  // Apply platform suffix to base image path if in platformDependent mode with testID
  let baseImageToUse = baseImage;
  const addPlatformSuffixForViewShot = mode === 'platformDependent' && testID;
  if (addPlatformSuffixForViewShot) {
    // Add platform suffix: "example.base" -> "example.base.ios"
    const baseName = path.basename(baseImage, '.base');
    const dirName = path.dirname(baseImage);
    baseImageToUse = path.join(dirName, `${baseName}.base.${platform}`);
  }

  const fileName = path.basename(baseImage, `.base`);

  // Apply platform suffix to view shot path if in platformDependent mode with testID
  const viewShotFileName = addPlatformSuffixForViewShot ? `${fileName}.${platform}` : fileName;

  const viewShotOutputPath = testID
    ? path.join(path.dirname(currentScreenshotPath), viewShotFileName + pngSuffix)
    : undefined;

  const baseImagePath = path.resolve(e2eDir, baseImageToUse + pngSuffix);

  const isScreenShot = mode === undefined && testID === undefined;

  const processedOutputPath = (() => {
    const basePath = (() => {
      if (isScreenShot) {
        return `${diffOutputPath}.diff.${platform}${pngSuffix}`;
      } else {
        // view shot
        if (addPlatformSuffixForViewShot) {
          return `${diffOutputPath}/${testID}.diff.${platform}${pngSuffix}`;
        } else {
          return `${diffOutputPath}/${testID}.diff${pngSuffix}`;
        }
      }
    })();
    return createUniqueFilePath(basePath, homeDir);
  })();

  const currentScreenshotArtifactPath = (() => {
    const basePath = (() => {
      if (isScreenShot) {
        return `${diffOutputPath}.${platform}${pngSuffix}`;
      } else {
        // view shot
        return `${diffOutputPath}/${testID}_full.${platform}${pngSuffix}`;
      }
    })();
    return createUniqueFilePath(basePath, homeDir);
  })();

  return {
    baseImagePath,
    currentScreenshotPath,
    viewShotOutputPath,
    imageForComparisonPath: viewShotOutputPath || currentScreenshotPath,
    diffOutputFilePath: processedOutputPath,
    currentScreenshotArtifactPath,
  };
};

function expandTilde(filePath: string, homeDir?: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(homeDir || os.homedir(), filePath.slice(2));
  }
  return filePath;
}

// e2e tests in CI run in repetition when a run fails, so we need to ensure unique file names
function createUniqueFilePath(outputPath: string, homeDir?: string): string {
  const expandedPath = expandTilde(outputPath, homeDir);
  const dir = path.dirname(expandedPath);
  const ext = path.extname(expandedPath);
  const baseName = path.basename(expandedPath, ext);

  let finalPath: string = expandedPath;
  let counter = 2;
  while (fs.existsSync(finalPath)) {
    finalPath = path.join(dir, `${baseName}_${counter.toString().padStart(2, '0')}${ext}`);
    counter++;
  }

  return path.resolve(finalPath);
}
