#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';

import { compareImages, type ComparisonResult } from './compareImages';
import { transformPaths } from './pathUtils';
import { resizeImage } from './resizeImage';
import { schema } from './schema';
import { takeScreenshot } from './takeScreenshot';
import { captureViewShotInProcess, cropViewByTestID } from './viewCropper';

const PORT = process.env.PORT || 7123;
const e2eDir = path.resolve(path.join(__dirname, '..', '..'));
const allowedHosts = [`localhost:${PORT}`, `127.0.0.1:${PORT}`];

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1', // Only bind to localhost for security
  async fetch(req) {
    if (!allowedHosts.includes(req.headers.get('host')?.toLowerCase() ?? '')) {
      return Response.json(
        {
          success: false,
          message: `The image comparison server rejected the request because its Host header is not ${allowedHosts.join(' or ')}. Send the request to http://localhost:${PORT}.`,
        },
        { status: 403 }
      );
    }
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/process') {
      // Browsers can send text/plain cross-origin without a CORS preflight, but not application/json.
      if (!req.headers.get('content-type')?.startsWith('application/json')) {
        return Response.json(
          {
            success: false,
            message:
              'The image comparison server rejected the request because its Content-Type is not application/json. Send the request body as JSON with the Content-Type: application/json header.',
          },
          { status: 415 }
        );
      }
      try {
        const bodyJson = await req.json();
        const parsedBody = schema.parse(bodyJson);
        const isNormalizationMode = 'mode' in parsedBody && parsedBody.mode === 'normalize';

        const { similarityThreshold, platform, resizingFactor, captureMode } = parsedBody;

        const testID = 'testID' in parsedBody ? parsedBody.testID : undefined;

        const {
          baseImagePath,
          currentScreenshotPath,
          viewShotOutputPath,
          imageForComparisonPath,
          diffOutputFilePath,
          currentScreenshotArtifactPath,
        } = transformPaths(e2eDir, parsedBody);

        await fs.promises.mkdir(path.dirname(currentScreenshotArtifactPath), { recursive: true });

        if (testID && viewShotOutputPath) {
          if (captureMode === 'in-process' && platform === 'ios') {
            // The inspector dylib renders the view at its exact bounds inside the app, so
            // there is no full-screen screenshot to take and nothing to crop.
            await captureViewShotInProcess({
              testID,
              viewShotPath: viewShotOutputPath,
              resizingFactor,
            });
          } else {
            if (captureMode === 'in-process') {
              console.log(
                `in-process capture is only available on iOS; falling back to screen capture on ${platform}`
              );
            }
            await takeScreenshot({
              platform,
              outputFilePath: currentScreenshotPath,
            });
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
          }

          await fs.promises.copyFile(viewShotOutputPath, currentScreenshotArtifactPath);
          console.log(`View shot copied to artifact: ${currentScreenshotArtifactPath}`);
        } else {
          await takeScreenshot({
            platform,
            outputFilePath: currentScreenshotPath,
          });
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

          const errorMessage = `Files(s) not found: ${missingFiles.join(', ')}`;
          console.error(errorMessage);

          return Response.json({ success: false, message: errorMessage }, { status: 404 });
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

        return Response.json(result, { status: result.success ? 200 : 400 });
      } catch (error) {
        console.error('Error processing image comparison:', error);
        return Response.json(
          {
            success: false,
            message: 'Image comparison failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
          { status: 500 }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Image Comparison Server running on http://localhost:${PORT}`);
console.log('Available endpoints:');
console.log('  POST /process    - Compare two images by path');
