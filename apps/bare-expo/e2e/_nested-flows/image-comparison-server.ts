#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

import { schema } from './schema';
import { takeScreenshot } from './screenshot';
import { compareImages, type ComparisonResult } from '../../scripts/compare-images';
import { transformPaths } from '../../scripts/lib/pathUtils';
import { ViewCropper } from '../../scripts/lib/viewCropper';

const PORT = process.env.PORT || 3000;

// @ts-ignore bun types are missing
Bun.serve({
  port: PORT,
  hostname: '127.0.0.1', // Only bind to localhost for security
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/process') {
      try {
        const bodyJson = await req.json();
        const parsedBody = schema.parse(bodyJson);
        const { similarityThreshold = 5, platform } = parsedBody;

        const testID = 'testID' in parsedBody ? parsedBody.testID : undefined;

        const e2eDir = path.resolve(path.join(__dirname, '..'));
        const {
          baseImagePath,
          currentScreenshotPath,
          viewShotOutputPath,
          imageForComparisonPath,
          diffOutputFilePath,
          currentScreenshotArtifactPath,
        } = transformPaths(e2eDir, parsedBody);

        await takeScreenshot({
          platform,
          outputFilePath: currentScreenshotPath,
          copyAlsoTo: currentScreenshotArtifactPath,
        });

        if (testID) {
          const viewCropper = new ViewCropper();
          // TODO get scale factor from simctl
          const displayScaleFactor = platform === 'android' ? 1 : 3;
          await viewCropper.cropViewByTestID({
            testID,
            currentScreenshotPath,
            viewShotPath: viewShotOutputPath,
            platform,
            displayScaleFactor,
          });
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

        const isCrossPlatformMode = 'mode' in parsedBody && parsedBody.mode === 'crossPlatform';

        const result: ComparisonResult = await compareImages({
          image1Path: baseImagePath,
          image2Path: imageForComparisonPath,
          outputPath: diffOutputFilePath,
          similarityThreshold,
          crossPlatformMode: isCrossPlatformMode,
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
