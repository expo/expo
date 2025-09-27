import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import Jimp from 'jimp-compact';
import os from 'os';
import path from 'path';
import { parseString } from 'xml2js';

export class ScreenshotAndroid {
  private deviceId: string;
  private verbose: boolean;

  constructor(deviceId: string, verbose: boolean) {
    this.deviceId = deviceId;
    this.verbose = verbose;
  }

  async takeScreenshotByTestIDAsync({
    testID,
    outputPath,
  }: {
    testID: string;
    outputPath: string;
  }): Promise<string> {
    const xmlViewHierarchy = await this.dumpViewHierarchy();
    const element = await this.findElementByResourceId(xmlViewHierarchy, testID);

    const bounds = element.bounds;
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    const tempFullScreenshot = `/sdcard/full_screenshot_${Date.now()}.png`;
    await this.runAdbCommand(['shell', 'screencap', '-p', tempFullScreenshot]);

    const tempLocalPath = path.join(os.tmpdir(), 'tmp.png');
    try {
      await this.runAdbCommand(['pull', tempFullScreenshot, tempLocalPath]);
      await this.runAdbCommand(['shell', 'rm', tempFullScreenshot]);

      await cropImageAsync({
        imagePath: tempLocalPath,
        outputPath,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });
      return outputPath;
    } finally {
      await fs.promises.rm(tempLocalPath, { force: true });
    }
  }

  private async runAdbCommand(args: string[]): Promise<string> {
    try {
      const result = await spawnAsync('adb', ['-s', this.deviceId, ...args], {
        stdio: 'pipe',
      });

      return result.stdout || '';
    } catch (error: any) {
      if (this.verbose) {
        console.error('ADB command failed:', error.message);
        if (error.stderr) {
          console.error('ADB command stderr:', error.stderr);
        }
      }
      throw error;
    }
  }

  private async dumpViewHierarchy(): Promise<string> {
    const xmlViewHierarchy = await this.runAdbCommand([
      'exec-out',
      'uiautomator',
      'dump',
      '--compressed',
      '/dev/tty',
    ]);
    // console.log('xmlViewHierarchy', xmlViewHierarchy);
    return xmlViewHierarchy;
  }

  private async findElementByResourceId(
    xmlViewHierarchy: string,
    resourceId: string
  ): Promise<ElementProperties> {
    return new Promise((resolve, reject) => {
      parseString(xmlViewHierarchy, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML dump: ${err}`));
          return;
        }

        if (!result.hierarchy) {
          reject(new Error(`Failed to parse XML dump: result.hierarchy is null or undefined`));
          return;
        }

        const element = this.searchNodes(result.hierarchy.node, resourceId);
        if (!element) {
          reject(new Error(`Element with testID "${resourceId}" not found`));
          return;
        }

        resolve(element);
      });
    });
  }

  private searchNodes(nodes: any[] | any, resourceId: string): ElementProperties | null {
    if (!nodes) {
      return null;
    }

    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

    for (const node of nodeArray) {
      if (!node || !node.$) {
        continue;
      }

      const nodeResourceId = node.$['resource-id'];

      if (nodeResourceId === resourceId) {
        return this.parseElementProperties(node);
      }

      if (node.node) {
        const childResult = this.searchNodes(node.node, resourceId);
        if (childResult) return childResult;
      }
    }

    return null;
  }

  private parseElementProperties(node: any): ElementProperties {
    const attrs = node.$ || {};
    const boundsStr = attrs.bounds || '[0,0][0,0]';
    const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);

    let bounds = { x: 0, y: 0, width: 0, height: 0 };
    if (boundsMatch) {
      const [, x1, y1, x2, y2] = boundsMatch.map(Number);
      bounds = {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };
    }

    return {
      resource_id: attrs['resource-id'] || '',
      bounds,
      class: attrs.class || '',
      text: attrs.text || '',
    };
  }
}

export async function cropImageAsync({
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
}

interface ElementProperties {
  resource_id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  class: string;
  text: string;
}

// If this script is run directly, compare the two images provided as command line arguments
if (require.main === module) {
  const screenshotAndroid = new ScreenshotAndroid('emulator-5554', true);
  const imageOutPath = await screenshotAndroid.takeScreenshotByTestIDAsync({
    testID: 'image-comparison-list',
    outputPath: path.join(os.tmpdir(), 'image1.png'),
  });
  console.log(`Image saved to: ${imageOutPath}`);
}
