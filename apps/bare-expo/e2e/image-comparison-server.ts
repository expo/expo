#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

import { compareImages, type ComparisonResult } from '../scripts/compare-images';

const PORT = process.env.PORT || 3000;

// @ts-ignore bun types
Bun.serve({
  port: PORT,
  hostname: '127.0.0.1', // Only bind to localhost for security
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'POST' && url.pathname === '/compare') {
      try {
        const body = await req.json();
        const { image1, image2, outputPath } = body;
        const message = 'Both image1 and image2 paths are required';

        if (!image1 || !image2) {
          console.error(message);
          return new Response(
            JSON.stringify({
              success: false,
              message,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Only allow files within the project directory
        const projectRoot = path.resolve(__dirname, '..');
        const image1Path = path.resolve(projectRoot, image1);
        const image2Path = path.resolve(projectRoot, image2);

        if (!image1Path.startsWith(projectRoot) || !image2Path.startsWith(projectRoot)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Invalid file paths - must be within project directory',
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const image1exists = fs.existsSync(image1Path);
        const image2exists = fs.existsSync(image2Path);
        if (!image1exists || !image2exists) {
          const missingFiles = [];
          if (!image1exists) missingFiles.push(`image1: ${image1Path}`);
          if (!image2exists) missingFiles.push(`image2: ${image2Path}`);

          const errorMessage = `File(s) not found: ${missingFiles.join(', ')}`;
          console.error(errorMessage);

          return new Response(
            JSON.stringify({
              success: false,
              message: errorMessage,
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const result: ComparisonResult = compareImages(image1Path, image2Path, outputPath || null);

        !result.success && console.error('Comparison result:', result);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

console.log(`🚀 Image Comparison Server running on http://localhost:${PORT}`);
console.log('Available endpoints:');
console.log(
  '  POST /compare    - Compare two images by path (JSON body: {"image1": "path", "image2": "path"})'
);
