import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import Jimp from 'jimp-compact';

import { MAESTRO_DRIVER_STARTUP_TIMEOUT } from './e2e-common';

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
  class?: string;
}

// iOS types
interface IOSAttributes {
  accessibilityText: string;
  title: '';
  value: '';
  text: '';
  hintText: '';
  'resource-id': '';
  bounds: string;
}

interface ViewNode {
  attributes: IOSAttributes;
  children?: ViewNode[];
}

export class ViewCropper {
  async cropViewByTestID({
    testID,
    currentScreenshotPath,
    platform,
    viewShotPath,
  }: {
    testID: string;
    currentScreenshotPath: string;
    platform: 'ios' | 'android';
    viewShotPath: string;
  }): Promise<{ viewShotPath: string }> {
    const element = await this.findElementByTestID(testID, platform);
    const bounds = element.bounds;

    await this.cropImageAsync({
      imagePath: currentScreenshotPath,
      outputPath: viewShotPath,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    // we don't care about the full screenshot when taking view shots
    console.log(`deleting full screenshot: ${currentScreenshotPath} because we have a view shot`);
    await fs.promises.rm(currentScreenshotPath, { force: true });

    return {
      viewShotPath,
    };
  }

  private async findElementByTestID(
    testID: string,
    platform: 'ios' | 'android'
  ): Promise<ElementProperties> {
    const jsonViewHierarchy = await this.dumpViewHierarchy(platform);
    const element = this.searchJsonNodes(jsonViewHierarchy, testID, platform);

    if (!element) {
      throw new Error(`Element with testID "${testID}" not found in ${platform} hierarchy`);
    }

    return element;
  }

  private async dumpViewHierarchy(platform: 'ios' | 'android'): Promise<ViewNode> {
    const startTime = Date.now();
    const result = await spawnAsync('maestro', [`--platform=${platform}`, 'hierarchy'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        MAESTRO_DRIVER_STARTUP_TIMEOUT,
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Maestro took ${duration}ms to capture the ${platform} view hierarchy`);

    const hierarchyOutput = result.stdout || '';
    const jsonStart = hierarchyOutput.indexOf('{');
    if (jsonStart >= 0) {
      const jsonData = JSON.parse(hierarchyOutput.slice(jsonStart));
      return jsonData;
    }

    throw new Error(`Failed to get valid JSON from maestro for ${platform}`);
  }

  private searchJsonNodes(
    node: ViewNode,
    resourceId: string,
    platform: 'ios' | 'android'
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
        return this.parseJsonElementProperties(currentNode, platform);
      }

      if (currentNode.children) {
        const childResult = this.searchJsonNodes(currentNode.children as any, resourceId, platform);
        if (childResult) return childResult;
      }
    }

    return null;
  }

  private parseJsonElementProperties(node: any, platform: 'ios' | 'android'): ElementProperties {
    const attrs = node.attributes;
    const boundsStr = attrs.bounds || '[0,0][0,0]';
    const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);

    let bounds = { x: 0, y: 0, width: 0, height: 0 };
    if (boundsMatch) {
      const [, x1, y1, x2, y2] = boundsMatch.map(Number);

      if (platform === 'ios') {
        // Apply pixel ratio for iOS
        const pixelRatio = 3;
        const scaledCoords = [x1, y1, x2, y2].map((coord) => coord * pixelRatio);
        bounds = {
          x: scaledCoords[0],
          y: scaledCoords[1],
          width: scaledCoords[2] - scaledCoords[0],
          height: scaledCoords[3] - scaledCoords[1],
        };
      } else {
        // Android - no scaling
        bounds = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        };
      }
    }

    return {
      resource_id: attrs['resource-id'] || '',
      bounds,
      class: attrs.class || '',
      text: attrs.text || '',
    };
  }

  private async cropImageAsync({
    imagePath,
    outputPath,
    x,
    y,
    width,
    height,
  }: {
    imagePath: string;
    outputPath: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<void> {
    const image = await Jimp.read(imagePath);
    const croppedImage = image.crop(x, y, width, height);
    await croppedImage.write(outputPath);

    // Ensure file is fully written to disk before returning
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fs.promises.access(outputPath, fs.constants.F_OK);
    console.log('wrote cropped image to', outputPath);
  }
}
