"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const cli_platform_android_1 = require("@react-native-community/cli-platform-android");
const helpers_1 = require("./helpers");
const constants_1 = require("./constants");
const DRAWABLES_CONFIGS = {
    drawable: {
        multiplier: 1,
    },
    'drawable-mdpi': {
        multiplier: 1,
    },
    'drawable-hdpi': {
        multiplier: 1.5,
    },
    'drawable-xhdpi': {
        multiplier: 2,
    },
    'drawable-xxhdpi': {
        multiplier: 3,
    },
    'drawable-xxxhdpi': {
        multiplier: 4,
    },
};
const FILENAMES = {
    SPLASH_SCREEN_DRAWABLE: 'splashscreen_image.png',
    SPLASH_SCREEN_XML: 'splashscreen.xml',
    COLORS: 'colors_splashscreen.xml',
    STYLES: 'styles_splashscreen.xml',
    ANDROID_MANIFEST: 'AndroidManifest.xml',
};
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn;t provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
async function configureSplashScreenDrawables(androidMainResPath, splashScreenImagePath) {
    await Promise.all(Object.keys(DRAWABLES_CONFIGS)
        .map(drawableDirectoryName => path_1.default.resolve(androidMainResPath, drawableDirectoryName, FILENAMES.SPLASH_SCREEN_DRAWABLE))
        .map(async (drawablePath) => {
        if (await fs_extra_1.default.pathExists(drawablePath)) {
            await fs_extra_1.default.remove(drawablePath);
        }
    }));
    if (splashScreenImagePath) {
        if (!(await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainResPath, 'drawable')))) {
            await fs_extra_1.default.mkdir(path_1.default.resolve(androidMainResPath, 'drawable'));
        }
        await fs_extra_1.default.copyFile(splashScreenImagePath, path_1.default.resolve(androidMainResPath, 'drawable', FILENAMES.SPLASH_SCREEN_DRAWABLE));
    }
}
async function configureColorsXML(androidMainResPath, splashScreenBackgroundColor) {
    await helpers_1.writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainResPath, 'values', FILENAMES.COLORS), {
        fileContent: `${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.FILE_TOP)}
<resources>
  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}
</resources>
`,
        replaceContent: `  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}\n`,
        replacePattern: /(?<=(?<openingTagLine>^.*?<resources>.*?$\n)(?<beforeLines>(?<beforeLine>^.*$\n)*?))(?<colorLine>^.*?(?<color><color name="splashscreen_background">.*<\/color>).*$\n)(?=(?<linesAfter>(?<afterLine>^.*$\n)*?)(?<closingTagLine>^.*?<\/resources>.*?$\n))/m,
        insertContent: `  <color name="splashscreen_background">${splashScreenBackgroundColor}</color> ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}\n`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
}
async function configureDrawableXML(androidMainResPath, resizeMode) {
    const nativeSplashScreen = resizeMode !== constants_1.ResizeMode.NATIVE
        ? ''
        : `

  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splashscreen_image"
    />
  </item>`;
    await helpers_1.writeToFile(path_1.default.resolve(androidMainResPath, 'drawable', FILENAMES.SPLASH_SCREEN_XML), `${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.FILE_TOP_NO_MODIFY)}
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>${nativeSplashScreen}
</layer-list>
`);
}
async function configureStylesXML(androidMainResPath) {
    await helpers_1.writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainResPath, 'values', FILENAMES.STYLES), {
        fileContent: `${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.FILE_TOP)}
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar"> ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}
    <item name="android:windowBackground">@drawable/splashscreen</item>  ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}
    <item name="android:windowDrawsSystemBarBackgrounds">true</item> <!-- Tells the system that the app would take care of drawing background for StatusBar -->
    <item name="android:statusBarColor">@android:color/transparent</item> <!-- Make StatusBar transparent by default -->
  </style>
</resources>
`,
        replaceContent: `    <item name="android:windowBackground">@drawable/splashscreen</item>  ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}\n`,
        replacePattern: /(?<=(?<styleNameLine>^.*?(?<styleName><style name="Theme\.App\.SplashScreen" parent=".*?">).*?$\n)(?<linesBeforeWindowBackgroundLine>(?<singleBeforeLine>^.*$\n)*?))(?<windowBackgroundLine>^.*?(?<windowBackground><item name="android:windowBackground">.*<\/item>).*$\n)(?=(?<linesAfterWindowBackgroundLine>(?<singleAfterLine>^.*$\n)*?)(?<closingTagLine>^.*?<\/style>.*?$\n))/m,
        insertContent: `  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">  ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}
    <item name="android:windowBackground">@drawable/splashscreen</item>  ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.LINE)}
  </style>
`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
}
async function configureAndroidManifestXML(androidMainPath) {
    const androidManifestPath = path_1.default.resolve(androidMainPath, 'AndroidManifest.xml');
    const r1 = await helpers_1.replaceOrInsertInFile(androidManifestPath, {
        replaceContent: `android:theme="@style/Theme.App.SplashScreen"`,
        replacePattern: /(?<nameBeforeTheme>(?<=(?<application1>^.*?<application(.*|\n)*?)(?<activity1>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<androidTheme1>android:theme=".*?"\s*?))|((?<=(?<application2>^.*?<application(.|\n)*?)(?<activity2>^.*?<activity(.|\n)*?))(?<androidTheme2>android:theme=".*?"\s*?)(?=((.|\n)*?android:name="\.MainActivity"(.|\n)*?)))/m,
        insertContent: `\n      android:theme="@style/Theme.App.SplashScreen"`,
        insertPattern: /(?<=(?<application>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity))(?<activityAttributes>(.|\n)*?android:name="\.MainActivity"(.|\n)*?>)/m,
    });
    const r2 = await helpers_1.replaceOrInsertInFile(androidManifestPath, {
        replaceContent: `\n\n    ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.ANDROID_MANIFEST)}\n`,
        replacePattern: RegExp(`(?<=(?<application>^.*?<application(.|\n)*?))([\n\t ])*(?<comment>${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.ANDROID_MANIFEST).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&' // eslint-disable-next-line no-useless-escape
        )})([\n\t ])*(?=(?<activity>(^.*?<activity)(.|\n)*?android:name="\.MainActivity"(.|\n)*?>))`, 'm'),
        insertContent: `\n    ${helpers_1.COMMENTS.wrapXML(helpers_1.COMMENTS.ANDROID_MANIFEST)}\n`,
        insertPattern: /(?<=(?<application>^.*?<application(.|\n)*?))(?<activity>(^.*?<activity)(.|\n)*?android:name="\.MainActivity"(.|\n)*?>)/m,
    });
    if (!r1.inserted && !r1.replaced && !r2.inserted && r2.replaced) {
        console.log(chalk_1.default.yellow(`${chalk_1.default.magenta('AndroidManifest.xml')} does not contain <activity /> entry for ${chalk_1.default.magenta('MainActivity')}. SplashScreen style will not be applied.`));
    }
}
/**
 * Configures or creates splash screen's:
 * - background color
 * - xml drawable file
 * - style with theme including 'android:windowBackground'
 * - theme for activity in AndroidManifest.xml
 */
async function configureSplashScreenXMLs(androidMainPath, resizeMode, splashScreenBackgroundColor) {
    const androidMainResPath = path_1.default.resolve(androidMainPath, 'res');
    await Promise.all([
        configureColorsXML(androidMainResPath, splashScreenBackgroundColor),
        configureDrawableXML(androidMainResPath, resizeMode),
        configureStylesXML(androidMainResPath),
        configureAndroidManifestXML(androidMainPath),
    ]);
}
/**
 * Injects specific code to MainApplication that would trigger SplashScreen mounting process.
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
        await helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /^import expo\.modules\.splashscreen\.SplashScreen;.*?\nimport expo\.modules\.splashscreen\.SplashScreenImageResizeMode;.*?$/m,
            replaceContent: `import expo.modules.splashscreen.SplashScreen;\nimport expo.modules.splashscreen.SplashScreenImageResizeMode;`,
            insertPattern: /(?=public class .* extends .* {.*$)/m,
            insertContent: `import expo.modules.splashscreen.SplashScreen;\nimport expo.modules.splashscreen.SplashScreenImageResizeMode;\n\n`,
        });
        await helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /^import com\.facebook\.react\.ReactRootView;.*?$/m,
            replaceContent: `import com.facebook.react.ReactRootView;`,
            insertPattern: /(?<=import com\.facebook\.react\.ReactActivity;.*?$)/m,
            insertContent: `\nimport com.facebook.react.ReactRootView;`,
        });
        // handle onCreate
        const r = await helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
            replacePattern: /(?<=super\.onCreate(.|\n)*?)SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\);.*$/m,
            replaceContent: `SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}`,
            insertPattern: /(?<=^.*super\.onCreate.*$)/m,
            insertContent: `\n    // SplashScreen.show(...) has to called after super.onCreate(...)\n    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}`,
        });
        let onCreateInserted = false;
        if (!r.replaced && !r.inserted) {
            // handle if sth went wrong
            // no previously defined onCreate -> insert basic one
            onCreateInserted = await helpers_1.insertToFile(mainActivityPathJava, {
                insertPattern: /(?<=public class .* extends .* {.*$)/m,
                insertContent: `\n
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to called after super.onCreate(...)
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView.class); ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}
  }\n`,
            });
            // with additional bundle import at the top
            await helpers_1.replaceOrInsertInFile(mainActivityPathJava, {
                replacePattern: /import android\.os\.Bundle;/m,
                replaceContent: 'import android.os.Bundle;',
                insertPattern: /(?<=(^.*?package .*?$))/m,
                insertContent: `\n\nimport android.os.Bundle;`,
            });
        }
        // check if SplashScreen.show() is added for the first time
        // if so - proceed with inserting handling transparent & translucent StatusBar
        if (r.inserted || onCreateInserted) {
            // insert import
            await helpers_1.insertToFile(mainActivityPathJava, {
                insertPattern: /(?<=(^.*?import\s*android\.os\.Bundle;.*?$))/m,
                insertContent: '\nimport android.view.WindowInsets;',
            });
            // insert method call - just below SplashScreen.show(...)
            await helpers_1.insertToFile(mainActivityPathJava, {
                insertPattern: /(?<=SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\);.*$)/m,
                insertContent: `\n    // StatusBar transparency & translucency that would work with RN has to be pragmatically configured.\n    this.allowDrawingBeneathStatusBar();`,
            });
            // insert method body as the last method in class
            await helpers_1.insertToFileBeforeLastOccurrence(mainActivityPathJava, {
                insertPattern: /^\s*}\s*$/gm,
                insertContent: `
  private void allowDrawingBeneathStatusBar() {
    // Hook into the window insets calculations and consume all the top insets so no padding will be added under the status bar.
    // This approach goes in pair with ReactNative's StatusBar module's approach.
    getWindow().getDecorView().setOnApplyWindowInsetsListener(
        (v, insets) -> {
          WindowInsets defaultInsets = v.onApplyWindowInsets(insets);
          return defaultInsets.replaceSystemWindowInsets(
              defaultInsets.getSystemWindowInsetLeft(),
              0,
              defaultInsets.getSystemWindowInsetRight(),
              defaultInsets.getSystemWindowInsetBottom());
        });
  }\n`,
            });
        }
        return;
    }
    if (isKotlin) {
        // handle imports
        await helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /^import expo\.modules\.splashscreen\.SplashScreen.*?\nimport expo\.modules\.splashscreen\.SplashScreenImageResizeMode.*?$/m,
            replaceContent: `import expo.modules.splashscreen.SplashScreen\nimport expo.modules.splashscreen.SplashScreenImageResizeMode`,
            insertPattern: /(?=class .* : .* {.*$)/m,
            insertContent: `import expo.modules.splashscreen.SplashScreen\nimport expo.modules.splashscreen.SplashScreenImageResizeMode\n\n`,
        });
        await helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /^import com\.facebook\.react\.ReactRootView.*?$/m,
            replaceContent: `import com.facebook.react.ReactRootView`,
            insertPattern: /(?<=import com\.facebook\.react\.ReactActivity.*?$)/m,
            insertContent: `\nimport com.facebook.react.ReactRootView`,
        });
        // handle onCreate
        const r = await helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
            replacePattern: /(?<=super\.onCreate(.|\n)*?)SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\).*$/m,
            replaceContent: `SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}`,
            insertPattern: /(?<=^.*super\.onCreate.*$)/m,
            insertContent: `\n    // SplashScreen.show(...) has to called after super.onCreate(...)\n    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}`,
        });
        let onCreateInserted = false;
        if (!r.replaced && !r.inserted) {
            // handle if sth went wrong
            // no previously defined onCreate -> insert basic one
            onCreateInserted = await helpers_1.insertToFile(mainActivityPathKotlin, {
                insertPattern: /(?<=class .* : .* {.*$)/m,
                insertContent: `\n
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to called after super.onCreate(...)
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView::class.java) ${helpers_1.COMMENTS.wrapJavaKotlin(helpers_1.COMMENTS.LINE)}
  }\n`,
            });
            // with additional bundle import at the top
            await helpers_1.replaceOrInsertInFile(mainActivityPathKotlin, {
                replacePattern: /import android\.os\.Bundle/m,
                replaceContent: 'import android.os.Bundle',
                insertPattern: /(?<=(^.*?package .*?$))/m,
                insertContent: `\n\nimport android.os.Bundle`,
            });
        }
        // check if SplashScreen.show() is added for the first time
        // if so - proceed with inserting handling transparent & translucent StatusBar
        if (r.inserted || onCreateInserted) {
            // insert method call - just below SplashScreen.show(...)
            await helpers_1.insertToFile(mainActivityPathKotlin, {
                insertPattern: /(?<=SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\).*$)/m,
                insertContent: `\n    // StatusBar transparency & translucency that would work with RN has to be pragmatically configured.\n    this.allowDrawingBeneathStatusBar()`,
            });
            // insert method body as the last method in class
            await helpers_1.insertToFileBeforeLastOccurrence(mainActivityPathKotlin, {
                insertPattern: /^\s*}\s*$/gm,
                insertContent: `
  private fun allowDrawingBeneathStatusBar() {
    // Hook into the window insets calculations and consume all the top insets so no padding will be added under the status bar.
    // This approach goes in pair with ReactNative's StatusBar module's approach.
    window.decorView.setOnApplyWindowInsetsListener { v, insets ->
      v.onApplyWindowInsets(insets).let {
        it.replaceSystemWindowInsets(
          it.systemWindowInsetLeft, 
          0,
          it.systemWindowInsetRight,
          it.systemWindowInsetBottom
        )
      }
    }
  }\n`,
            });
        }
        return;
    }
    console.log(chalk_1.default.red(`Failed to configure 'MainActivity'.`));
}
async function configureAndroidSplashScreen({ imagePath, resizeMode, backgroundColor, }) {
    const projectRootPath = path_1.default.resolve();
    const androidMainPath = path_1.default.resolve(projectRootPath, 'android/app/src/main');
    return Promise.all([
        await configureSplashScreenDrawables(path_1.default.resolve(androidMainPath, 'res'), imagePath),
        await configureSplashScreenXMLs(androidMainPath, resizeMode, backgroundColor),
        await configureShowingSplashScreen(projectRootPath, resizeMode),
    ]).then(() => { });
}
exports.default = configureAndroidSplashScreen;
//# sourceMappingURL=configureAndroidSplashScreen.js.map