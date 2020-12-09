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
    instructions += `If you are not using global.Expo or global.__expo directly in your source code, then they may used in one of your dependencies.\n`;
    instructions += `Learn more: https://expo.fyi/deprecated-globals\n`;
    console.warn(`Your project is accessing the following APIs from a deprecated global rather than a module import: ${instructions}`);
    packages = [];
}
//# sourceMappingURL=deprecatedGlobal.js.map