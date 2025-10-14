import spawnAsync from '@expo/spawn-async';
import Jimp from 'jimp-compact';
import fs from 'node:fs';

import { MAESTRO_ENV_VARS } from '../../../scripts/lib/e2e-common';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ElementProperties {
  resource_id: string;
  bounds: Bounds;
  text: string;
}

interface Attributes {
  accessibilityText: string;
  text: string;
  bounds: string;
}

interface ViewNode {
  attributes: Attributes;
  children?: ViewNode[];
}

async function dumpViewHierarchy(platform: 'ios' | 'android'): Promise<ViewNode> {
  const startTime = Date.now();
  const result = await spawnAsync('maestro', [`--platform=${platform}`, 'hierarchy'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      ...MAESTRO_ENV_VARS,
    },
  });
  const duration = Date.now() - startTime;

  console.log(`Maestro took ${duration}ms to capture the ${platform} view hierarchy`);

  const hierarchyOutput = result.stdout || '';
  const jsonStart = hierarchyOutput.indexOf('{');
  if (jsonStart >= 0) {
    const jsonData = JSON.parse(hierarchyOutput.slice(jsonStart));
    return jsonData;
  }

  throw new Error(`Failed to get valid JSON from maestro for ${platform}`);
}

function parseJsonElementProperties(node: ViewNode, displayScaleFactor: number): ElementProperties {
  const attrs = node.attributes;
  const boundsStr = attrs.bounds || '[0,0][0,0]';
  const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);

  let bounds = { x: 0, y: 0, width: 0, height: 0 };
  if (boundsMatch) {
    const [, x1, y1, x2, y2] = boundsMatch.map(Number);

    const scaledCoords = [x1, y1, x2, y2].map((coord) => coord * displayScaleFactor);
    bounds = {
      x: scaledCoords[0],
      y: scaledCoords[1],
      width: scaledCoords[2] - scaledCoords[0],
      height: scaledCoords[3] - scaledCoords[1],
    };
  }

  return {
    resource_id: attrs['resource-id'] || '',
    bounds,
    text: attrs.text || '',
  };
}

function searchJsonNodes(
  node: ViewNode,
  resourceId: string,
  displayScaleFactor: number
): ElementProperties | null {
  if (!node) {
    return null;
  }

  const nodeArray = Array.isArray(node) ? node : [node];

  for (const currentNode of nodeArray) {
    if (!currentNode || !currentNode.attributes) {
      continue;
    }

    const nodeResourceId = currentNode.attributes['resource-id'];

    if (nodeResourceId === resourceId) {
      return parseJsonElementProperties(currentNode, displayScaleFactor);
    }

    if (currentNode.children) {
      const childResult = searchJsonNodes(currentNode.children, resourceId, displayScaleFactor);
      if (childResult) return childResult;
    }
  }

  return null;
}

async function findElementByTestID(
  testID: string,
  platform: 'ios' | 'android',
  displayScaleFactor: number
): Promise<ElementProperties> {
  const jsonViewHierarchy = await dumpViewHierarchy(platform);
  const element = searchJsonNodes(jsonViewHierarchy, testID, displayScaleFactor);

  if (!element) {
    throw new Error(`Element with testID "${testID}" not found in ${platform} hierarchy`);
  }

  return element;
}

async function cropImageAsync({
  imagePath,
  outputPath,
  x,
  y,
  width,
  height,
  resizingFactor,
}: {
  imagePath: string;
  outputPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  resizingFactor: number;
}): Promise<void> {
  const image = await Jimp.read(imagePath);
  let croppedImage = image.crop(x, y, width, height);

  // Resize after cropping if resizingFactor is not 1
  if (resizingFactor !== 1) {
    const newWidth = Math.round(croppedImage.bitmap.width * resizingFactor);
    const newHeight = Math.round(croppedImage.bitmap.height * resizingFactor);
    croppedImage = croppedImage.resize(newWidth, newHeight);
  }

  await croppedImage.write(outputPath);

  // Ensure file is fully written to disk before returning
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await fs.promises.access(outputPath, fs.constants.F_OK);
  console.log('wrote cropped image to', outputPath);
}

export async function cropViewByTestID({
  testID,
  currentScreenshotPath,
  platform,
  viewShotPath,
  displayScaleFactor,
  resizingFactor,
}: {
  testID: string;
  currentScreenshotPath: string;
  platform: 'ios' | 'android';
  viewShotPath: string;
  displayScaleFactor: number; // always 1 for Android, but can vary for iOS
  resizingFactor: number;
}): Promise<{ viewShotPath: string }> {
  const element = await findElementByTestID(testID, platform, displayScaleFactor);
  const bounds = element.bounds;

  await cropImageAsync({
    imagePath: currentScreenshotPath,
    outputPath: viewShotPath,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    resizingFactor,
  });

  return {
    viewShotPath,
  };
}
