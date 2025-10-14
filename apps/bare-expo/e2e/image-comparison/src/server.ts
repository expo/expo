#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';

import { compareImages, type ComparisonResult } from './compareImages';
import { transformPaths } from './pathUtils';
import { resizeImage } from './resizeImage';
import { schema } from './schema';
import { takeScreenshot } from './takeScreenshot';
import { cropViewByTestID } from './viewCropper';

const PORT = process.env.PORT || 3000;
const e2eDir = path.resolve(path.join(__dirname, '..', '..'));

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1', // Only bind to localhost for security
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/process') {
      try {
        const bodyJson = await req.json();
        const parsedBody = schema.parse(bodyJson);
        const isNormalizationMode = 'mode' in parsedBody && parsedBody.mode === 'normalize';
        const thresholdDefaultValue = isNormalizationMode ? 15 : 5;

        const {
          similarityThreshold = thresholdDefaultValue,
          platform,
          resizingFactor,
        } = parsedBody;

        const testID = 'testID' in parsedBody ? parsedBody.testID : undefined;

        const {
          baseImagePath,
          currentScreenshotPath,
          viewShotOutputPath,
          imageForComparisonPath,
          diffOutputFilePath,
          currentScreenshotArtifactPath,
        } = transformPaths(e2eDir, parsedBody);

        // TODO add utility for taking screenshot and cropping by testID
        await takeScreenshot({
          platform,
          outputFilePath: currentScreenshotPath,
        });
        await fs.promises.mkdir(path.dirname(currentScreenshotArtifactPath), { recursive: true });

        if (testID) {
          // TODO get scale factor from simctl
          const displayScaleFactor = platform === 'android' ? 1 : 3;
          await cropViewByTestID({
            testID,
            currentScreenshotPath,
            viewShotPath: viewShotOutputPath,
            platform,
            displayScaleFactor,
            resizingFactor,
          });
          // we don't care about the full screenshot when taking view shots
          console.log(
            `deleting full screenshot: ${currentScreenshotPath} because we have a view shot`
          );
          await fs.promises.rm(currentScreenshotPath, { force: true });

          await fs.promises.copyFile(viewShotOutputPath, currentScreenshotArtifactPath);
          console.log(`View shot copied to artifact: ${currentScreenshotArtifactPath}`);
        } else {
          await resizeImage(currentScreenshotPath, resizingFactor);

          await fs.promises.copyFile(currentScreenshotPath, currentScreenshotArtifactPath);
          console.log(`Screenshot copied to artifact: ${currentScreenshotArtifactPath}`);
        }

        const baseImageExists = fs.existsSync(baseImagePath);
        const image2exists = fs.existsSync(imageForComparisonPath);
        if (!baseImageExists || !image2exists) {
          const missingFiles = [];
          if (!baseImageExists) missingFiles.push(`image1: ${baseImagePath}`);
          if (!image2exists) missingFiles.push(`image2: ${imageForComparisonPath}`);

          const errorMessage = `Files not found: ${missingFiles.join(', ')}`;
          console.error(errorMessage);

          return new Response(
            JSON.stringify({
              success: false,
              message: errorMessage,
            }),
            {
              status: 404,
              headers: jsonHeaders,
            }
          );
        }

        const result: ComparisonResult = await compareImages({
          image1Path: baseImagePath,
          image2Path: imageForComparisonPath,
          outputPath: diffOutputFilePath,
          similarityThreshold,
          isNormalizationMode,
        });

        if (result.success) {
          console.log(result.message);
        } else {
          console.error(result);
        }
        if (result.diffImagePath) {
          console.log(`Diff image written to: ${result.diffImagePath}`);
        }

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: jsonHeaders,
        });
      } catch (error) {
        console.error('Error processing image comparison:', error);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Image comparison failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          }),
          {
            status: 500,
            headers: jsonHeaders,
          }
        );
      }
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    });
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

console.log(`🚀 Image Comparison Server running on http://localhost:${PORT}`);
console.log('Available endpoints:');
console.log('  POST /process    - Compare two images by path');
