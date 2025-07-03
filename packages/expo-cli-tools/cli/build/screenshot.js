"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenshot = void 0;
var child_process_1 = require("child_process");
var os_1 = require("os");
var path_1 = require("path");
var takeScreenshot = function (app) {
    var platform = getAppPlatform(app);
    // create temp filename
    var tempDir = os_1.default.tmpdir();
    var tempFileName = "tempfile-".concat(Date.now(), ".png");
    var tempFilePath = path_1.default.join(tempDir, tempFileName);
    if (platform === 'android') {
        (0, child_process_1.execSync)('adb shell screencap -p /sdcard/screenshot.png');
        (0, child_process_1.execSync)("adb pull /sdcard/screenshot.png ".concat(tempFilePath));
    }
    else {
        var command = "xcrun simctl io booted screenshot '".concat(tempFilePath, "';");
        (0, child_process_1.execSync)(command);
    }
    return tempFilePath;
};
exports.takeScreenshot = takeScreenshot;
var getAppPlatform = function (app) {
    if (app.deviceName.startsWith('sdk_')) {
        return 'android';
    }
    else {
        return 'ios';
    }
};
//# sourceMappingURL=screenshot.js.map