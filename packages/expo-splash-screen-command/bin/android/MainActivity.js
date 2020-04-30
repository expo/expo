"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_platform_android_1 = require("@react-native-community/cli-platform-android");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const StateManager_1 = __importDefault(require("../StateManager"));
const string_helpers_1 = require("../string-helpers");
/**
 * Injects specific code to MainActivity that would trigger SplashScreen mounting process.
 */
async function configureMainActivity(projectRootPath, resizeMode) {
    var _a;
    // eslint-disable-next-line
    const mainApplicationPath = (_a = cli_platform_android_1.projectConfig(projectRootPath)) === null || _a === void 0 ? void 0 : _a.mainFilePath;
    if (!mainApplicationPath) {
        throw new Error(`Failed to configure 'MainActivity'.`);
    }
    const mainActivityPathJava = path_1.default.resolve(mainApplicationPath, '../MainActivity.java');
    const mainActivityPathKotlin = path_1.default.resolve(mainApplicationPath, '../MainActivity.kt');
    const isJava = await fs_extra_1.default.pathExists(mainActivityPathJava);
    const isKotlin = !isJava && (await fs_extra_1.default.pathExists(mainActivityPathKotlin));
    if (!isJava && !isKotlin) {
        throw new Error(`Failed to find 'MainActivity' file.`);
    }
    const fileContent = await fs_extra_1.default.readFile(isJava ? mainActivityPathJava : mainActivityPathKotlin, 'utf-8');
    const { state: newFileContent } = new StateManager_1.default(fileContent)
        // importing SplashScreen
        .applyAction(content => {
        const [succeeded, newContent] = string_helpers_1.replace(content, {
            replacePattern: /^import expo\.modules\.splashscreen\.SplashScreen.*?\nimport expo\.modules\.splashscreen\.SplashScreenImageResizeMode.*?$/m,
            replaceContent: `import expo.modules.splashscreen.SplashScreen${isJava ? ';' : ''}
import expo.modules.splashscreen.SplashScreenImageResizeMode${isJava ? ';' : ''}`,
        });
        return [newContent, 'replacedSplashImports', succeeded];
    })
        .applyAction((content, { replacedSplashImports }) => {
        if (replacedSplashImports) {
            return [content, 'insertedSplashImports', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertPattern: isJava ? /(?=public class .* extends .* {.*$)/m : /(?=class .* : .* {.*$)/m,
            insertContent: `import expo.modules.splashscreen.SplashScreen${isJava ? ';' : ''}
import expo.modules.splashscreen.SplashScreenImageResizeMode${isJava ? ';' : ''}

`,
        });
        return [newContent, 'insertedSplashImports', succeeded];
    })
        // importing ReactRootView
        .applyAction(content => {
        const [succeeded, newContent] = string_helpers_1.replace(content, {
            replacePattern: /^import com\.facebook\.react\.ReactRootView.*?$/m,
            replaceContent: `import com.facebook.react.ReactRootView${isJava ? ';' : ''}`,
        });
        return [newContent, 'replacedReactImport', succeeded];
    })
        .applyAction((content, { replacedReactImport }) => {
        if (replacedReactImport) {
            return [content, 'insertedReactImport', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertPattern: /(?<=import com\.facebook\.react\.ReactActivity.*?$)/m,
            insertContent: `\nimport com.facebook.react.ReactRootView${isJava ? ';' : ''}`,
        });
        return [newContent, 'insertedReactImport', succeeded];
    })
        // registering SplashScreen in onCreate()
        .applyAction(content => {
        const [succeeded, newContent] = string_helpers_1.replace(content, {
            replacePattern: /(?<=super\.onCreate(.|\n)*?)SplashScreen\.show\(this, SplashScreenImageResizeMode\..*\).*$/m,
            replaceContent: `SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ${isJava ? 'ReactRootView.class);' : 'ReactRootView::class.java)'}`,
        });
        return [newContent, 'replacedInOnCreate', succeeded];
    })
        .applyAction((content, { replacedInOnCreate }) => {
        if (replacedInOnCreate) {
            return [content, 'insertedInOnCreate', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertPattern: /(?<=^.*super\.onCreate.*$)/m,
            insertContent: `
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ${isJava ? 'ReactRootView.class);' : 'ReactRootView::class.java)'}`,
        });
        return [newContent, 'insertedInOnCreate', succeeded];
    })
        // inserting basic onCreate()
        .applyAction((content, { replacedInOnCreate, insertedInOnCreate }) => {
        if (replacedInOnCreate || insertedInOnCreate) {
            return [content, 'insertedOnCreate', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertPattern: isJava
                ? /(?<=public class .* extends .* {.*$)/m
                : /(?<=class .* : .* {.*$)/m,
            insertContent: `
  ${isJava
                ? `@Override
  protected void onCreate(Bundle savedInstanceState`
                : 'override fun onCreate(savedInstanceState: Bundle?'}) {
    super.onCreate(savedInstanceState)${isJava ? ';' : ''}
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ${isJava ? 'ReactRootView.class);' : 'ReactRootView::class.java)'}
  }
`,
        });
        return [newContent, 'insertedOnCreate', succeeded];
    })
        // importing Bundle
        .applyAction((content, { replacedInOnCreate, insertedInOnCreate }) => {
        if (replacedInOnCreate || insertedInOnCreate) {
            return [content, 'replacedBundleImport', false];
        }
        const [succeeded, newContent] = string_helpers_1.replace(content, {
            replacePattern: /import android\.os\.Bundle/m,
            replaceContent: 'import android.os.Bundle',
        });
        return [newContent, 'replacedBundleImport', succeeded];
    })
        .applyAction((content, { replacedInOnCreate, insertedInOnCreate }) => {
        if (replacedInOnCreate || insertedInOnCreate) {
            return [content, 'insertedBundleImport', false];
        }
        const [succeeded, newContent] = string_helpers_1.insert(content, {
            insertPattern: /(?<=(^.*?package .*?$))/m,
            insertContent: `\n\nimport android.os.Bundle${isJava ? ';' : ''}`,
        });
        return [newContent, 'insertedBundleImport', succeeded];
    });
    await fs_extra_1.default.writeFile(isJava ? mainActivityPathJava : mainActivityPathKotlin, newFileContent);
}
exports.default = configureMainActivity;
//# sourceMappingURL=MainActivity.js.map