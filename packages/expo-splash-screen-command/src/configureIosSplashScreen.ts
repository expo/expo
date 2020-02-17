import path from 'path';
import chalk from 'chalk';
import colorString from 'color-string';
import fs from 'fs-extra';
import { projectConfig } from '@react-native-community/cli-platform-ios';

import { ResizeMode } from './constants';
import { replaceOrInsertInFile, writeToFile, COMMENTS } from './helpers';

// each filename is relational according to iOS root project directory
const FILENAMES = {
  INFO_PLIST: './Info.plist',
  SPLASHSCREEN_PLIST: './SplashScreen.plist',
  STORYBOARD: './Base.lproj/SplashScreen.storyboard',
  IMAGESET: './Images.xcassets/SplashScreen.imageset',
  IMAGESET_CONTENTS: './Images.xcassets/SplashScreen.imageset/Contents.json',
  PNG: './splashscreen.png',
};

/**
 * Configures:
 * - [FILENAMES.INFO_PLIST] to show [FILENAMES.STORYBOARD] filename as Splash/Launch Screen
 * - [FILENAMES.SPLASHSCREEN_PLIST] to contain all options that needs to be available during app runtime.
 */
async function configurePlists(iosProjectPath: string, resizeMode: ResizeMode) {
  await replaceOrInsertInFile(path.resolve(iosProjectPath, FILENAMES.INFO_PLIST), {
    replaceContent: '<string>SplashScreen</string>',
    replacePattern: /(?<=<key>UILaunchStoryboardName<\/key>(.|\n)*?)<string>.*?<\/string>/gm,
    insertContent: `  <key>UILaunchStoryboardName</key>\n  <string>SplashScreen</string>\n`,
    insertPattern: /<\/dict>/gm,
    insertBeforeLastOccurrence: true,
  });

  await writeToFile(
    path.resolve(iosProjectPath, FILENAMES.SPLASHSCREEN_PLIST),
    `${COMMENTS.wrapXML(COMMENTS.FILE_TOP_NO_MODIFY)}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ResizeMode</key>
  <string>${resizeMode.toUpperCase()}</string>
</dict>
</plist>
`
  );
}

async function configureStoryboard(
  iosProjectPath: string,
  resizeMode: ResizeMode,
  backgroundColor: string,
  imageAvailable: boolean
) {
  let contentMode;
  switch (resizeMode) {
    case ResizeMode.CONTAIN:
      contentMode = 'scaleAspectFit';
      break;
    case ResizeMode.COVER:
      contentMode = 'scaleAspectFill';
      break;
    default:
      console.log(
        chalk.red(`resizeMode = ${chalk.yellow(resizeMode)} is not supported for iOS platform.`)
      );
      return;
  }

  const color = colorString.get(backgroundColor)?.value;
  if (!color) {
    console.log(chalk.red(`backgroundColor is invalid.`));
    return;
  }

  const [r, g, b, a] = color;
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const alpha = a;

  await writeToFile(
    path.resolve(iosProjectPath, FILENAMES.STORYBOARD),
    `${COMMENTS.wrapXML(COMMENTS.FILE_TOP_NO_MODIFY)}
<?xml version="1.0" encoding="UTF-8"?>
<document
  type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB"
  version="3.0"
  toolsVersion="15705"
  targetRuntime="iOS.CocoaTouch"
  propertyAccessControl="none"
  useAutolayout="YES"
  launchScreen="YES"
  useTraitCollections="YES"
  useSafeAreas="YES"
  colorMatched="YES"
  initialViewController="EXPO-VIEWCONTROLLER-1"
>
  <device id="retina6_1" orientation="portrait" appearance="light"/>
  <dependencies>
    <deployment identifier="iOS"/>
    <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="15706"/>
    <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
  </dependencies>
  <scenes>
    <!--View Controller-->
    <scene sceneID="EXPO-SCENE-1">
      <objects>
        <viewController id="EXPO-VIEWCONTROLLER-1" sceneMemberID="viewController">
          <imageView
            key="view"
            clipsSubviews="YES"
            userInteractionEnabled="NO"
            contentMode="${contentMode}"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"
            ${imageAvailable ? 'image="SplashScreen"' : ''}
            id="EXPO-IMAGEVIEW-1"
          >
            <rect key="frame" x="0.0" y="0.0" width="800" height="1600"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <color key="backgroundColor" red="${red}" green="${green}" blue="${blue}" alpha="${alpha}" colorSpace="custom" customColorSpace="sRGB"/>
          </imageView>
          <size key="freeformSize" width="800" height="1600"/>
        </viewController>
        <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
      </objects>
      <point key="canvasLocation" x="141" y="130"/>
    </scene>
  </scenes>
  <resources>
    <image name="SplashScreen" width="600" height="1200"/>
  </resources>
</document>
`
  );
}

async function configureAssets(iosProjectPath: string, imagePath?: string) {
  const imageSetPath = path.resolve(iosProjectPath, FILENAMES.IMAGESET);

  // ensure old SplashScreen imageSet is removed
  if (await fs.pathExists(imageSetPath)) {
    await fs.remove(imageSetPath);
  }

  if (imagePath) {
    await fs.mkdirp(imageSetPath);
    const contentJson = {
      images: [
        {
          idiom: 'universal',
          filename: FILENAMES.PNG,
          scale: '1x',
        },
        {
          idiom: 'universal',
          scale: '2x',
        },
        {
          idiom: 'universal',
          scale: '3x',
        },
      ],
      info: {
        version: 1,
        author: 'xcode',
      },
    };

    await fs.writeFile(
      path.resolve(iosProjectPath, FILENAMES.IMAGESET_CONTENTS),
      JSON.stringify(contentJson, null, 2)
    );

    await fs.copyFile(imagePath, path.resolve(iosProjectPath, FILENAMES.PNG));
  }
}

export default async function configureIosSplashScreen({
  imagePath,
  resizeMode,
  backgroundColor,
}: {
  imagePath?: string;
  resizeMode: ResizeMode;
  backgroundColor: string;
}) {
  const projectRootPath = path.resolve();
  const xcodeProjPath = projectConfig(projectRootPath, { plist: [] })?.projectPath;
  if (!xcodeProjPath) {
    console.log(chalk.red(`Couldn't find iOS project. Cannot configure iOS.`));
    return;
  }

  // xcodeProjPath contains path to .xcodeproj directory
  if (!xcodeProjPath.endsWith('.xcodeproj')) {
    console.log(chalk.red(`Couldn't find .xcodeproj directory.`));
    return;
  }
  const projectPath = xcodeProjPath.substring(0, xcodeProjPath.length - '.xcodeproj'.length);

  return Promise.all([
    configurePlists(projectPath, resizeMode),
    configureStoryboard(projectPath, resizeMode, backgroundColor, !!imagePath),
    configureAssets(projectPath, imagePath),
  ]).then(([]) => {
    
  });
}
