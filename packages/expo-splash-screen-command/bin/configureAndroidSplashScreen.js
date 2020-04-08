"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_platform_android_1 = require("@react-native-community/cli-platform-android");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const file_helpers_1 = require("./file-helpers");
const FILENAMES = {
    SPLASH_SCREEN_PNG: 'splashscreen_image.png',
};
const DRAWABLES_CONFIGS = {
    default: {
        path: `./res/drawable/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 1,
    },
    mdpi: {
        path: `./res/drawable-mdpi/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 1,
    },
    hdpi: {
        path: `./res/drawable-hdpi/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 1.5,
    },
    xhdpi: {
        path: `./res/drawable-xhdpi/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 2,
    },
    xxhdpi: {
        path: `./res/drawable-xxhdpi/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 3,
    },
    xxxhdpi: {
        path: `./res/drawable-xxxhdpi/${FILENAMES.SPLASH_SCREEN_PNG}`,
        dimensionsMultiplier: 4,
    },
};
const FILES_PATHS = {
    DRAWABLE_DIRECTORY: './res/drawable',
    SPLASH_SCREEN_DRAWABLE: `./res/drawable/${FILENAMES.SPLASH_SCREEN_PNG}`,
    SPLASH_SCREEN_COLORS: './res/values/colors_splashscreen.xml',
    SPLASH_SCREEN_XML: './res/drawable/splashscreen.xml',
    STYLES: './res/values/styles_splashscreen.xml',
    ANDROID_MANIFEST: './AndroidManifest.xml',
};
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
async function configureSplashScreenDrawables(androidMainPath, splashScreenImagePath) {
    await Promise.all(Object.values(DRAWABLES_CONFIGS).map(async ({ path: drawbalePath }) => {
        if (await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainPath, drawbalePath))) {
            await fs_extra_1.default.remove(path_1.default.resolve(androidMainPath, drawbalePath));
        }
    }));
    if (splashScreenImagePath) {
        if (!(await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainPath, FILES_PATHS.DRAWABLE_DIRECTORY)))) {
            await fs_extra_1.default.mkdir(path_1.default.resolve(androidMainPath, FILES_PATHS.DRAWABLE_DIRECTORY));
        }
        await fs_extra_1.default.copyFile(splashScreenImagePath, path_1.default.resolve(androidMainPath, FILES_PATHS.SPLASH_SCREEN_DRAWABLE));
    }
}
async function configureColorsXML(androidMainPath, splashScreenBackgroundColor) {
    await file_helpers_1.writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainPath, FILES_PATHS.SPLASH_SCREEN_COLORS), {
        fileContent: `${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.FILE_TOP)}
<resources>
  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}
</resources>
  `,
        replaceContent: `  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}}\n`,
        replacePattern: /(?<=(?<openingTagLine>^.*?<resources>.*?$\n)(?<beforeLines>(?<beforeLine>^.*$\n)*?))(?<colorLine>^.*?(?<color><color name="splashscreen_background">.*<\/color>).*$\n)(?=(?<linesAfter>(?<afterLine>^.*$\n)*?)(?<closingTagLine>^.*?<\/resources>.*?$\n))/m,
        insertContent: `  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}}\n`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
}
async function configureDrawableXML(androidMainPath, resizeMode) {
    const nativeSplashScreen = resizeMode !== constants_1.ResizeMode.NATIVE
        ? ''
        : `

  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splashscreen_image"
    />
  </item>`;
    await file_helpers_1.writeToFile(path_1.default.resolve(androidMainPath, FILES_PATHS.SPLASH_SCREEN_XML), `${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.FILE_TOP_NO_MODIFY)}
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>${nativeSplashScreen}
</layer-list>
`);
}
async function configureStylesXML(androidMainPath) {
    await file_helpers_1.writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainPath, FILES_PATHS.STYLES), {
        fileContent: `${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.FILE_TOP)}
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar"> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}
    <item name="android:windowBackground">@drawable/splashscreen</item> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}
    <!-- Customize your splash screen theme here -->
  </style>
</resources>
`,
        replaceContent: `    <item name="android:windowBackground">@drawable/splashscreen</item> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}\n`,
        replacePattern: /(?<=(?<styleNameLine>^.*?(?<styleName><style name="Theme\.App\.SplashScreen" parent=".*?">).*?$\n)(?<linesBeforeWindowBackgroundLine>(?<singleBeforeLine>^.*$\n)*?))(?<windowBackgroundLine>^.*?(?<windowBackground><item name="android:windowBackground">.*<\/item>).*$\n)(?=(?<linesAfterWindowBackgroundLine>(?<singleAfterLine>^.*$\n)*?)(?<closingTagLine>^.*?<\/style>.*?$\n))/m,
        insertContent: `  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar"> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}
    <item name="android:windowBackground">@drawable/splashscreen</item> ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.LINE)}
  </style>
`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
}
async function configureAndroidManifestXML(androidMainPath) {
    const androidManifestPath = path_1.default.resolve(androidMainPath, FILES_PATHS.ANDROID_MANIFEST);
    const r1 = await file_helpers_1.replaceOrInsertInFile(androidManifestPath, {
        replaceContent: `android:theme="@style/Theme.App.SplashScreen"`,
        replacePattern: /(?<nameBeforeTheme>(?<=(?<application1>^.*?<application(.*|\n)*?)(?<activity1>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<androidTheme1>android:theme=".*?"\s*?))|((?<=(?<application2>^.*?<application(.|\n)*?)(?<activity2>^.*?<activity(.|\n)*?))(?<androidTheme2>android:theme=".*?"\s*?)(?=((.|\n)*?android:name="\.MainActivity"(.|\n)*?)))/m,
        insertContent: `\n      android:theme="@style/Theme.App.SplashScreen"`,
        insertPattern: /(?<=(?<application>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity))(?<activityAttributes>(.|\n)*?android:name="\.MainActivity"(.|\n)*?>)/m,
    });
    const r2 = await file_helpers_1.replaceOrInsertInFile(androidManifestPath, {
        replaceContent: `\n\n    ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.ANDROID_MANIFEST)}\n`,
        replacePattern: RegExp(`(?<=(?<application>^.*?<application(.|\n)*?))([\n\t ])*(?<comment>${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.ANDROID_MANIFEST).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&' // eslint-disable-next-line no-useless-escape
        )})([\n\t ])*(?=(?<activity>(^.*?<activity)(.|\n)*?android:name="\.MainActivity"(.|\n)*?>))`, 'm'),
        insertContent: `\n    ${file_helpers_1.COMMENTS.wrapXML(file_helpers_1.COMMENTS.ANDROID_MANIFEST)}\n`,
        insertPattern: /(?<=(?<application>^.*?<application(.|\n)*?))(?<activity>(^.*?<activity)(.|\n)*?android:name="\.MainActivity"(.|\n)*?>)/m,
    });
    if (!r1.inserted && !r1.replaced && !r2.inserted && r2.replaced) {
        console.log(chalk_1.default.yellow(`${chalk_1.default.magenta('AndroidManifest.xml')} does not contain <activity /> entry for ${chalk_1.default.magenta('MainActivity')}. SplashScreen style will not be applied.`));
    }
}
/**
 * Injects specific code to MainActivity that would trigger SplashScreen mounting process.
 */
async function configureShowingSplashScreen(projectRootPath, resizeMode) {
    var _a;
    // eslint-disable-next-line
    const mainApplicationPath = (_a = cli_platform_android_1.projectConfig(projectRootPath)) === null || _a === void 0 ? void 0 : _a.mainFilePath;
    if (!mainApplicationPath) {
        console.log(chalk_1.default.red(`Failed to configure 'MainActivity'.`));
        return;
    }
    const mainActivityPathJava = path_1.default.resolve(mainApplicationPath, '../MainActivity.java');
    const mainActivityPathKotlin = path_1.default.resolve(mainApplicationPath, '../MainActivity.kt');
    const isJava = await fs_extra_1.default.pathExists(mainActivityPathJava);
    const isKotlin = !isJava && (await fs_extra_1.default.pathExists(mainActivityPathKotlin));
    if (isJava) {
        // handle imports
        await file_helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /^import expo\.modules\.splashscreen\.SplashScreen;.*?\nimport expo\.modules\.splashscreen\.SplashScreenImageResizeMode;.*?$/m,
            replaceContent: `import expo.modules.splashscreen.SplashScreen;\nimport expo.modules.splashscreen.SplashScreenImageResizeMode;`,
            insertPattern: /(?=public class .* extends .* {.*$)/m,
            insertContent: `import expo.modules.splashscreen.SplashScreen;\nimport expo.modules.splashscreen.SplashScreenImageResizeMode;\n\n`,
        });
        await file_helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /^import com\.facebook\.react\.ReactRootView;.*?$/m,
            replaceContent: `import com.facebook.react.ReactRootView;`,
            insertPattern: /(?<=import com\.facebook\.react\.ReactActivity;.*?$)/m,
            insertContent: `\nimport com.facebook.react.ReactRootView;`,
        });
        // handle onCreate
        const r = await file_helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /(?<=super\.onCreate(.|\n)*?)SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\);.*$/m,
            replaceContent: `SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}`,
            insertPattern: /(?<=^.*super\.onCreate.*$)/m,
            insertContent: `\n    // SplashScreen.show(...) has to called after super.onCreate(...)\n    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}`,
        });
        if (!r.replaced && !r.inserted) {
            // handle if sth went wrong
            // no previously defined onCreate -> insert basic one
            await file_helpers_1.insertToFile(mainActivityPathJava, {
                insertPattern: /(?<=public class .* extends .* {.*$)/m,
                insertContent: `\n
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to called after super.onCreate(...)
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}
  }\n`,
            });
            // with additional bundle import at the top
            await file_helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
                replacePattern: /import android\.os\.Bundle;/m,
                replaceContent: 'import android.os.Bundle;',
                insertPattern: /(?<=(^.*?package .*?$))/m,
                insertContent: `\n\nimport android.os.Bundle;`,
            });
        }
        return;
    }
    if (isKotlin) {
        // handle imports
        await file_helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /^import expo\.modules\.splashscreen\.SplashScreen.*?\nimport expo\.modules\.splashscreen\.SplashScreenImageResizeMode.*?$/m,
            replaceContent: `import expo.modules.splashscreen.SplashScreen\nimport expo.modules.splashscreen.SplashScreenImageResizeMode`,
            insertPattern: /(?=class .* : .* {.*$)/m,
            insertContent: `import expo.modules.splashscreen.SplashScreen\nimport expo.modules.splashscreen.SplashScreenImageResizeMode\n\n`,
        });
        await file_helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /^import com\.facebook\.react\.ReactRootView.*?$/m,
            replaceContent: `import com.facebook.react.ReactRootView`,
            insertPattern: /(?<=import com\.facebook\.react\.ReactActivity.*?$)/m,
            insertContent: `\nimport com.facebook.react.ReactRootView`,
        });
        // handle onCreate
        const r = await file_helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /(?<=super\.onCreate(.|\n)*?)SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\).*$/m,
            replaceContent: `SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}`,
            insertPattern: /(?<=^.*super\.onCreate.*$)/m,
            insertContent: `\n    // SplashScreen.show(...) has to called after super.onCreate(...)\n    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}`,
        });
        if (!r.replaced && !r.inserted) {
            // no previously defined onCreate -> insert basic one
            await file_helpers_1.insertToFile(mainActivityPathKotlin, {
                insertPattern: /(?<=class .* : .* {.*$)/m,
                insertContent: `\n
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to called after super.onCreate(...)
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${file_helpers_1.COMMENTS.wrapJavaKotlin(file_helpers_1.COMMENTS.LINE)}
  }\n`,
            });
            // with additional bundle import at the top
            await file_helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
                replacePattern: /import android\.os\.Bundle/m,
                replaceContent: 'import android.os.Bundle',
                insertPattern: /(?<=(^.*?package .*?$))/m,
                insertContent: `\n\nimport android.os.Bundle`,
            });
        }
        return;
    }
    console.log(chalk_1.default.red(`Failed to configure 'MainActivity'.`));
}
async function configureAndroidSplashScreen({ imagePath, resizeMode, backgroundColor, }) {
    const projectRootPath = path_1.default.resolve();
    const androidMainPath = path_1.default.resolve(projectRootPath, 'android/app/src/main');
    await Promise.all([
        configureSplashScreenDrawables(androidMainPath, imagePath),
        configureColorsXML(androidMainPath, backgroundColor),
        configureDrawableXML(androidMainPath, resizeMode),
        configureStylesXML(androidMainPath),
        configureAndroidManifestXML(androidMainPath),
        configureShowingSplashScreen(projectRootPath, resizeMode),
    ]);
}
exports.default = configureAndroidSplashScreen;
//# sourceMappingURL=configureAndroidSplashScreen.js.map