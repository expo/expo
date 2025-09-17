#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

import { compareImages, type ComparisonResult } from '../scripts/compare-images';

const PORT = process.env.PORT || 3000;
// const MAESTRO_DIR = path.join(__dirname, '.maestro');

// @ts-ignore bun types
Bun.serve({
  port: PORT,
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

        if (!image1 || !image2) {
          console.error('Both image1 and image2 paths are required');
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Both image1 and image2 paths are required',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Resolve full paths
        const image1Path = path.resolve(image1);
        const image2Path = path.resolve(image2);

        const image1exists = fs.existsSync(image1Path);
        const image2exists = fs.existsSync(image2Path);
        if (!image1exists || !image2exists) {
          console.error(
            'Not found: image1: ',
            image1exists,
            ' (path: ',
            image1Path,
            ') image2: ',
            image2exists,
            ' (path: ',
            image2Path,
            ')'
          );
          return new Response(
            JSON.stringify({
              success: false,
              message: `Not found: image1: ${image1exists} (path: ${image1Path}) image2: ${image2exists} (path: ${image2Path})`,
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
