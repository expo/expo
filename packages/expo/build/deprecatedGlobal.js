let packages = [];
export default function deprecatedGlobal(name) {
    if (__DEV__) {
        packages.push(name);
        setTimeout(logWarning, 1000);
    }
}
function logWarning() {
    if (!packages.length) {
        return;
    }
    let instructions = '';
    packages = Array.from(new Set(packages));
    packages.sort();
    instructions += packages.join(', ');
    instructions += `.\n\n`;
    instructions += `The global "__expo" and "Expo" objects will be removed in SDK 41. Learn more about how to fix this warning: https://expo.fyi/deprecated-globals\n`;
    console.warn(`Your project is accessing the following APIs from a deprecated global rather than a module import: ${instructions}`);
    packages = [];
}
//# sourceMappingURL=deprecatedGlobal.js.map