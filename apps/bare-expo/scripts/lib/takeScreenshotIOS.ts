import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import Jimp from 'jimp-compact';
import os from 'os';
import path from 'path';

type Attributes = {
  accessibilityText: string;
  title: '';
  value: '';
  text: '';
  hintText: '';
  'resource-id': '';
  // bounds: '[0,0][0,0]';
  bounds: 'string';
};

type Node = {
  attributes: Attributes;
  children?: Node[];
};

export class ScreenshotIOS {
  private verbose: boolean;

  constructor(verbose: boolean) {
    this.verbose = verbose;
  }

  async takeScreenshotByTestIDAsync({
    testID,
    currentScreenshotPath,
    platform,
    mode,
    baseImage,
  }: {
    testID: string;
    currentScreenshotPath: string;
    platform: string;
    mode: 'crossPlatform';
    baseImage: string;
  }): Promise<{
    viewShotPath: string;
  }> {
    const xmlViewHierarchy = await this.dumpViewHierarchy();
    const element = await this.findElementByResourceId(xmlViewHierarchy, testID);

    const bounds = element.bounds;
    const fileName = path.basename(baseImage, `.base.png`);
    const outputPath = path.join(path.dirname(currentScreenshotPath), fileName + `.png`);
    console.log({ outputPath, bounds, fileName, baseImage });

    await cropImageAsync({
      imagePath: currentScreenshotPath,
      outputPath,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      viewShotPath: outputPath,
    };
  }

  private async runMaestroCommand(args: string[]): Promise<string> {
    try {
      // const result = await spawnAsync('maestro', ['--device', this.deviceId, ...args], {
      //   stdio: 'pipe',
      // });
      const result = await spawnAsync('maestro', ['--platform=ios', ...args], {
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
  private async runCommand(name: string, args: string[]): Promise<string> {
    try {
      const result = await spawnAsync(name, [...args], {
        stdio: 'pipe',
      });

      return result.stdout || '';
    } catch (error: any) {
      if (this.verbose) {
        console.error(`${name} command failed:`, error.message);
        if (error.stderr) {
          console.error(`${name} command stderr:`, error.stderr);
        }
      }
      throw error;
    }
  }

  private async dumpViewHierarchy(): Promise<Node> {
    const xmlViewHierarchy = await this.runMaestroCommand(['hierarchy']);
    // console.log('xmlViewHierarchy', xmlViewHierarchy);
    const one = xmlViewHierarchy.indexOf('{');
    return JSON.parse(xmlViewHierarchy.slice(one));
  }

  private async findElementByResourceId(
    jsonViewHierarchy: Node,
    resourceId: string
  ): Promise<ElementProperties> {
    return this.searchNodes(jsonViewHierarchy, resourceId);
  }

  private searchNodes(nodes: Node, resourceId: string): ElementProperties | null {
    if (!nodes) {
      return null;
    }

    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

    for (const node of nodeArray) {
      if (!node || !node.attributes) {
        continue;
      }

      const nodeResourceId = node.attributes['resource-id'];

      if (nodeResourceId === resourceId) {
        return this.parseElementProperties(node);
      }

      if (node.children) {
        const childResult = this.searchNodes(node.children, resourceId);
        if (childResult) return childResult;
      }
    }

    return null;
  }

  private parseElementProperties(node: Node): ElementProperties {
    const attrs = node.attributes;
    const boundsStr = attrs.bounds || '[0,0][0,0]';
    const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);

    let bounds = { x: 0, y: 0, width: 0, height: 0 };
    if (boundsMatch) {
      // xcrun simctl io 04D8D98E-8C24-4949-8402-E1EFFAC51691 enumerate
      const pixelRatio = 3;
      const [, x1, y1, x2, y2] = boundsMatch.map(Number).map((it) => it * pixelRatio);
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

  // Ensure file is fully written to disk before returning
  await fs.promises.access(outputPath, fs.constants.F_OK);
}

interface ElementProperties {
  resource_id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
}

// If this script is run directly, compare the two images provided as command line arguments
if (require.main === module) {
  const screenshotAndroid = new ScreenshotIOS('04D8D98E-8C24-4949-8402-E1EFFAC51691', true);
  // await this.runCommand('xcrun', ['simctl', 'io', 'booted', 'screenshot', tempFullScreenshot]);

  const imageOutPath = await screenshotAndroid.takeScreenshotByTestIDAsync({
    testID: 'image-comparison-list',
    outputPath: path.join(os.tmpdir(), 'image1.png'),
  });
  console.log(`Image saved to: ${imageOutPath}`);
}
