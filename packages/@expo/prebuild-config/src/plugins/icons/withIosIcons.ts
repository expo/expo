import {
  ConfigPlugin,
  IOSConfig,
  WarningAggregator,
  withDangerousMod,
  withXcodeProject,
} from '@expo/config-plugins';
import { ExpoConfig, IOSIcons } from '@expo/config-types';
import { createSquareAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'fs';
import path from 'path';

import { ContentsJson, ContentsJsonImage, writeContentsJsonAsync } from './AssetContents';

const { getProjectName } = IOSConfig.XcodeUtils;

const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';

export const withIosIcons: ConfigPlugin = (config) => {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      await setIconsAsync(config, config.modRequest.projectRoot);
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const icon = getIcons(config);
    const projectName = config.modRequest.projectName;

    if (icon && typeof icon === 'string' && path.extname(icon) === '.icon' && projectName) {
      const iconName = path.basename(icon, '.icon');
      setIconName(config.modResults, iconName);
      addIconFileToProject(config.modResults, projectName, iconName);
    }
    return config;
  });

  return config;
};

export function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): IOSIcons | string | null {
  const iosSpecificIcons = config.ios?.icon;

  if (iosSpecificIcons) {
    // For backwards compatibility, the icon can be a string
    if (typeof iosSpecificIcons === 'string') {
      return iosSpecificIcons || config.icon || null;
    }

    if (typeof iosSpecificIcons === 'object') {
      const paths = [iosSpecificIcons.light, iosSpecificIcons.dark, iosSpecificIcons.tinted].filter(
        Boolean
      );
      for (const iconPath of paths) {
        if (typeof iconPath === 'string' && path.extname(iconPath) === '.icon') {
          WarningAggregator.addWarningIOS(
            'icon',
            `Liquid glass icons (.icon) should be provided as a string to the "ios.icon" property, not as an object. Found: "${iconPath}"`
          );
        }
      }
    }

    // in iOS 18 introduced the ability to specify dark and tinted icons, which users can specify as an object
    if (!iosSpecificIcons.light && !iosSpecificIcons.dark && !iosSpecificIcons.tinted) {
      return config.icon || null;
    }

    return iosSpecificIcons;
  }

  // Top level icon property should not be used to specify a `.icon` folder
  if (config.icon && typeof config.icon === 'string' && path.extname(config.icon) === '.icon') {
    WarningAggregator.addWarningIOS(
      'icon',
      `Liquid glass icons (.icon) should be provided via the "ios.icon" property, not the root "icon" property. Found: "${config.icon}"`
    );
  }

  if (config.icon) {
    return config.icon;
  }

  return null;
}

export async function setIconsAsync(config: ExpoConfig, projectRoot: string) {
  const icon = getIcons(config);

  if (
    !icon ||
    (typeof icon === 'string' && !icon) ||
    (typeof icon === 'object' && !icon?.light && !icon?.dark && !icon?.tinted)
  ) {
    WarningAggregator.addWarningIOS('icon', 'No icon is defined in the Expo config.');
  }

  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  if (typeof icon === 'string' && path.extname(icon) === '.icon') {
    return await addLiquidGlassIcon(icon, projectRoot, iosNamedProjectRoot);
  }

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs.promises.mkdir(path.join(iosNamedProjectRoot, IMAGESET_PATH), { recursive: true });

  const imagesJson: ContentsJson['images'] = [];

  const baseIconPath = typeof icon === 'object' ? icon?.light || icon?.dark || icon?.tinted : icon;

  // Store the image JSON data for assigning via the Contents.json
  const baseIcon = await generateUniversalIconAsync(projectRoot, {
    icon: baseIconPath,
    cacheKey: 'universal-icon',
    iosNamedProjectRoot,
    platform: 'ios',
  });

  imagesJson.push(baseIcon);

  if (typeof icon === 'object') {
    if (icon?.dark) {
      const darkIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.dark,
        cacheKey: 'universal-icon-dark',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'dark',
      });

      imagesJson.push(darkIcon);
    }

    if (icon?.tinted) {
      const tintedIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.tinted,
        cacheKey: 'universal-icon-tinted',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'tinted',
      });

      imagesJson.push(tintedIcon);
    }
  }

  // Finally, write the Contents.json
  await writeContentsJsonAsync(path.join(iosNamedProjectRoot, IMAGESET_PATH), {
    images: imagesJson,
  });
}

/**
 * Return the project's named iOS path: ios/MyProject/
 *
 * @param projectRoot Expo project root path.
 */
function getIosNamedProjectPath(projectRoot: string): string {
  const projectName = getProjectName(projectRoot);
  return path.join(projectRoot, 'ios', projectName);
}

function getAppleIconName(size: number, scale: number, appearance?: 'dark' | 'tinted'): string {
  let name = 'App-Icon';

  if (appearance) {
    name = `${name}-${appearance}`;
  }

  name = `${name}-${size}x${size}@${scale}x.png`;

  return name;
}

export async function generateUniversalIconAsync(
  projectRoot: string,
  {
    icon,
    cacheKey,
    iosNamedProjectRoot,
    platform,
    appearance,
  }: {
    platform: 'watchos' | 'ios';
    icon?: string | null;
    appearance?: 'dark' | 'tinted';
    iosNamedProjectRoot: string;
    cacheKey: string;
  }
): Promise<ContentsJsonImage> {
  const size = 1024;
  const filename = getAppleIconName(size, 1, appearance);

  let source: Buffer;

  if (icon) {
    // Using this method will cache the images in `.expo` based on the properties used to generate them.
    // this method also supports remote URLs and using the global sharp instance.
    source = (
      await generateImageAsync(
        { projectRoot, cacheType: IMAGE_CACHE_NAME + cacheKey },
        {
          src: icon,
          name: filename,
          width: size,
          height: size,
          // Transparency needs to be preserved in dark variant, but can safely be removed in "light" and "tinted" variants.
          removeTransparency: appearance !== 'dark',
          // The icon should be square, but if it's not then it will be cropped.
          resizeMode: 'cover',
          // Force the background color to solid white to prevent any transparency. (for "any" and "tinted" variants)
          // TODO: Maybe use a more adaptive option based on the icon color?
          backgroundColor: appearance !== 'dark' ? '#ffffff' : undefined,
        }
      )
    ).source;
  } else {
    // Create a white square image if no icon exists to mitigate the chance of a submission failure to the app store.
    source = await createSquareAsync({ size });
  }
  // Write image buffer to the file system.
  const assetPath = path.join(iosNamedProjectRoot, IMAGESET_PATH, filename);
  await fs.promises.writeFile(assetPath, source);

  return {
    filename,
    idiom: 'universal',
    platform,
    size: `${size}x${size}`,
    ...(appearance ? { appearances: [{ appearance: 'luminosity', value: appearance }] } : {}),
  };
}

async function addLiquidGlassIcon(
  iconPath: string,
  projectRoot: string,
  iosNamedProjectRoot: string
): Promise<void> {
  const iconName = path.basename(iconPath, '.icon');
  const sourceIconPath = path.join(projectRoot, iconPath);
  const targetIconPath = path.join(iosNamedProjectRoot, `${iconName}.icon`);

  if (!fs.existsSync(sourceIconPath)) {
    WarningAggregator.addWarningIOS(
      'icon',
      `Liquid glass icon file not found at path: ${iconPath}`
    );
    return;
  }

  await fs.promises.cp(sourceIconPath, targetIconPath, { recursive: true });
}

/**
 * Adds the .icons name to the project
 */
function setIconName(project: any, iconName: string): void {
  const configurations = project.pbxXCBuildConfigurationSection();

  for (const config of Object.values(configurations)) {
    if ((config as any)?.buildSettings) {
      (config as any).buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = iconName;
    }
  }
}

/**
 * Adds the .icon file to the project
 */
function addIconFileToProject(project: any, projectName: string, iconName: string): void {
  const iconPath = `${iconName}.icon`;

  IOSConfig.XcodeUtils.addResourceFileToGroup({
    filepath: `${projectName}/${iconPath}`,
    groupName: projectName,
    project,
    isBuildFile: true,
    verbose: true,
  });
}
