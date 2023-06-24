// https://developer.apple.com/documentation/Xcode/configuring-your-app-icon
// VisionAppIcon.solidimagestack
// - Contents.json
// {
//   "info" : {
//     "author" : "expo",
//     "version" : 1
//   },
//   "layers" : [
//     {
//       "filename" : "Front.solidimagestacklayer"
//     },
//     {
//       "filename" : "Middle.solidimagestacklayer"
//     },
//     {
//       "filename" : "Back.solidimagestacklayer"
//     }
//   ]
// }
// - Front.solidimagestacklayer
// -- Contents.json
// {
//   "info" : {
//     "author" : "expo",
//     "version" : 1
//   }
// }
// -- Content.imageset
// --- Contents.json
// {
//   "images" : [
//     {
//       "filename" : "image.png",
//       "idiom" : "reality",
//       "scale" : "2x"
//     }
//   ],
//   "info" : {
//     "author" : "expo",
//     "version" : 1
//   }
// }
// --- image.png
// - Middle.solidimagestacklayer
// - Back.solidimagestacklayer
import { ConfigPlugin, withDangerousMod, withXcodeProject } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { writeContentsJsonAsync } from './AssetContents';
import { generateXrIconLayerAsync } from './withIosIcons';

// Background must be opaque
// All must be 1024x1024

// Order is especially important!
const XR_ICON_IMAGE_LAYERS = [
  {
    name: 'Front',
  },
  {
    name: 'Middle',
  },
  {
    name: 'Back',
    opaque: true,
  },
];

export const withXrosIcon: ConfigPlugin<{ front: string; middle: string; back: string }> = (
  config,
  props
) => {
  const xcassetName = 'VisionAppIcon';

  withXcodeProject(config, (config) => {
    // TODO: Link to the pbxproj
    return config;
  });

  return withDangerousMod(config, [
    'ios',
    async (config) => {
      await createXrosIconAsync(config.modRequest.projectRoot, {
        rootAssetsDirectory: path.join(
          config.modRequest.projectRoot,
          config.modRequest.projectName!,
          // TODO: Modern Xcode uses `Assets.xcassets`
          'Images.xcassets'
        ),
        xcassetName,
        layers: [props.front, props.middle, props.back],
      });
      return config;
    },
  ]);
};

export async function createXrosIconAsync(
  projectRoot: string,
  options: {
    xcassetName: string;
    rootAssetsDirectory: string;
    /** front, middle, back */
    layers: [string, string, string];
  }
) {
  const imgAssetFolder = path.join(
    options.rootAssetsDirectory,
    options.xcassetName + '.solidimagestack'
  );

  await Promise.all([
    writeContentsJsonAsync(imgAssetFolder, {
      layers: XR_ICON_IMAGE_LAYERS.map((layer) => ({
        filename: layer.name + '.solidimagestacklayer',
      })),
    }),
    ...XR_ICON_IMAGE_LAYERS.map(async (type, index) => {
      const layerAssetDir = path.join(imgAssetFolder, type.name + '.solidimagestacklayer');
      const contentAssetDir = path.join(layerAssetDir, 'Content.imageset');

      const data = await generateXrIconLayerAsync(projectRoot, {
        icon: options.layers[index],
        cacheKey: 'xr-' + type.name,
        removeTransparency: type.opaque ?? false,
      });

      return Promise.all([
        writeContentsJsonAsync(layerAssetDir),
        writeContentsJsonAsync(contentAssetDir, {
          images: data.images,
        }),
        fs.promises.writeFile(path.join(contentAssetDir, data.asset.filename), data.asset.source),
      ]);
    }),
  ]);
}
