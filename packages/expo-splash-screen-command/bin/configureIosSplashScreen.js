"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_platform_ios_1 = require("@react-native-community/cli-platform-ios");
const chalk_1 = __importDefault(require("chalk"));
const color_string_1 = __importDefault(require("color-string"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const file_helpers_1 = require("./file-helpers");
const xcode_1 = require("./xcode");
const FILENAMES = {
    SPLASH_SCREEN_PNG: 'splashscreen.png',
};
// each filename is relational according to iOS root project directory
const FILES_PATHS = {
    INFO_PLIST: 'Info.plist',
    STORYBOARD: './SplashScreen.storyboard',
    IMAGESET: './Images.xcassets/SplashScreen.imageset',
    IMAGESET_CONTENTS: './Images.xcassets/SplashScreen.imageset/Contents.json',
    PNG: `./Images.xcassets/SplashScreen.imageset/${FILENAMES.SPLASH_SCREEN_PNG}`,
};
/**
 * Configures [INFO_PLIST] to show [STORYBOARD] filename as Splash/Launch Screen.
 */
async function configureInfoPlist(iosProjectPath) {
    await file_helpers_1.replaceOrInsertInFile(path_1.default.resolve(iosProjectPath, FILES_PATHS.INFO_PLIST), {
        replaceContent: '<string>SplashScreen</string>',
        replacePattern: /(?<=<key>UILaunchStoryboardName<\/key>(.|\n)*?)<string>.*?<\/string>/m,
        insertContent: `  <key>UILaunchStoryboardName</key>\n  <string>SplashScreen</string>\n`,
        insertPattern: /<\/dict>/gm,
        insertBeforeLastOccurrence: true,
    });
}
/**
 * Creates [STORYBOARD] file containing ui description of Splash/Launch Screen.
 */
async function configureStoryboard(iosProjectPath, resizeMode, backgroundColor, splashScreenImagePresent) {
    var _a;
    let contentMode;
    switch (resizeMode) {
        case constants_1.ResizeMode.CONTAIN:
            contentMode = 'scaleAspectFit';
            break;
        case constants_1.ResizeMode.COVER:
            contentMode = 'scaleAspectFill';
            break;
        default:
            console.log(chalk_1.default.red(`resizeMode = ${chalk_1.default.yellow(resizeMode)} is not supported for iOS platform.`));
            return;
    }
    const color = (_a = color_string_1.default.get(backgroundColor)) === null || _a === void 0 ? void 0 : _a.value;
    if (!color) {
        console.log(chalk_1.default.red(`backgroundColor is invalid.`));
        return;
    }
    const [r, g, b, a] = color;
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const alpha = a;
    await file_helpers_1.writeToFile(path_1.default.resolve(iosProjectPath, FILES_PATHS.STORYBOARD), `<?xml version="1.0" encoding="UTF-8"?>
${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.FILE_TOP_NO_MODIFY)}
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
        <viewController
          storyboardIdentifier="SplashScreenViewController"
          id="EXPO-VIEWCONTROLLER-1"
          sceneMemberID="viewController"
        >
          <imageView
            key="view"
            clipsSubviews="YES"
            userInteractionEnabled="NO"
            contentMode="${contentMode}"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"
            ${splashScreenImagePresent ? 'image="SplashScreen"' : ''}
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
`);
}
/**
 * Creates [IMAGESET] containing image for Splash/Launch Screen.
 */
async function configureAssets(iosProjectPath, imagePath) {
    const imageSetPath = path_1.default.resolve(iosProjectPath, FILES_PATHS.IMAGESET);
    // ensure old SplashScreen imageSet is removed
    if (await fs_extra_1.default.pathExists(imageSetPath)) {
        await fs_extra_1.default.remove(imageSetPath);
    }
    if (imagePath) {
        await fs_extra_1.default.mkdirp(imageSetPath);
        const contentJson = {
            images: [
                {
                    idiom: 'universal',
                    filename: FILENAMES.SPLASH_SCREEN_PNG,
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
        await fs_extra_1.default.writeFile(path_1.default.resolve(iosProjectPath, FILES_PATHS.IMAGESET_CONTENTS), JSON.stringify(contentJson, null, 2));
        await fs_extra_1.default.copyFile(imagePath, path_1.default.resolve(iosProjectPath, FILES_PATHS.PNG));
    }
}
/**
 * Reads iOS project and locates `.pbxproj` file for further parsing and modifications.
 */
async function readIosProject(projectRootPath) {
    const config = cli_platform_ios_1.projectConfig(projectRootPath, { plist: [] });
    if (!config) {
        throw new Error(chalk_1.default.red(`Couldn't find iOS project. Cannot configure iOS.`));
    }
    const { projectPath: xcodeProjPath, pbxprojPath } = config;
    // xcodeProjPath contains path to .xcodeproj directory
    if (!xcodeProjPath.endsWith('.xcodeproj')) {
        throw new Error(chalk_1.default.red(`Couldn't find .xcodeproj directory.`));
    }
    const projectPath = xcodeProjPath.substring(0, xcodeProjPath.length - '.xcodeproj'.length);
    const projectName = path_1.default.basename(projectPath);
    const pbxProject = new xcode_1.project(pbxprojPath);
    return {
        projectName,
        projectPath,
        pbxProject,
        loadPbxProject: () => new Promise(resolve => pbxProject.parse(err => {
            if (err) {
                throw new Error(`${chalk_1.default.red('.pbxproj file parsing issue:')} ${err.message}.`);
            }
            resolve();
        })),
    };
}
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
function updatePbxProject(pbxProject, projectName) {
    const applicationNativeTarget = pbxProject.getTarget('com.apple.product-type.application');
    if (!applicationNativeTarget) {
        throw new Error(chalk_1.default.red(`Couldn't locate application PBXNativeTarget in '.xcodeproj' file.`));
    }
    if (applicationNativeTarget.target.name !== projectName) {
        throw new Error(chalk_1.default.red(`Application native target name mismatch. Expected ${chalk_1.default.yellow(projectName)}, but found ${chalk_1.default.yellow(applicationNativeTarget.target.name)}.`));
    }
    // Check if `${projectName}/SplashScreen.storyboard` already exists
    // Path relative to `ios` directory
    const storyboardFilePath = path_1.default.join(projectName, FILES_PATHS.STORYBOARD);
    if (!pbxProject.hasFile(storyboardFilePath)) {
        const group = pbxProject.findPBXGroupKey({ name: projectName });
        if (!group) {
            throw new Error(chalk_1.default.red(`Couldn't locate proper PBXGroup '.xcodeproj' file.`));
        }
        pbxProject.addStoryboardFile(storyboardFilePath, {
            target: applicationNativeTarget.uuid,
            group,
        });
    }
}
async function configureIosSplashScreen({ imagePath, resizeMode, backgroundColor, }) {
    const projectRootPath = path_1.default.resolve();
    const { projectPath, pbxProject, loadPbxProject, projectName } = await readIosProject(projectRootPath);
    await Promise.all([
        loadPbxProject(),
        configureInfoPlist(projectPath),
        configureStoryboard(projectPath, resizeMode, backgroundColor, !!imagePath),
        configureAssets(projectPath, imagePath),
    ]);
    updatePbxProject(pbxProject, projectName);
    await fs_extra_1.default.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
exports.default = configureIosSplashScreen;
//# sourceMappingURL=configureIosSplashScreen.js.map