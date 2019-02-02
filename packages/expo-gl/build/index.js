import * as GLView from './GLView';
export * from './GLView';
let wasImportWarningShown = false;
// @ts-ignore: Temporarily define an export named "FileSystem" for legacy compatibility
Object.defineProperty(exports, 'GLView', {
    get() {
        if (!wasImportWarningShown) {
            console.warn(`The syntax "import { GLView } from 'expo-gl'" is deprecated. Use "import * as GLView from 'expo-gl'" or import named exports instead.`);
            wasImportWarningShown = true;
        }
        return GLView;
    },
});
//# sourceMappingURL=index.js.map