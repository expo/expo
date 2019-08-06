let messages = [];
let packages = [];
let namedImports = [];
export default function removedModule(message, namedImport, packageName) {
    if (__DEV__) {
        messages.push(message);
        packages.push(packageName);
        namedImports.push(namedImport);
        setTimeout(throwError, 1000);
    }
}
function throwError() {
    if (!messages.length) {
        return;
    }
    let instructions = '';
    messages = Array.from(new Set(messages));
    messages.sort();
    packages = Array.from(new Set(packages));
    packages.sort();
    namedImports = Array.from(new Set(namedImports));
    namedImports.sort();
    instructions += namedImports.join(', ');
    instructions += `.\n\n`;
    instructions += `1. Add correct versions of these packages to your project using:\n\n`;
    instructions += `   expo install ${packages.join(' ')}\n\n`;
    instructions += `   If "install" is not recognized as an expo command, update your expo-cli installation.\n\n`;
    instructions += `2. Change your imports so they use specific packages instead of the "expo" package:\n\n`;
    messages.forEach(message => {
        instructions += ` - ${message}\n`;
    });
    instructions += '\n';
    let message = `The following APIs have moved to separate packages and importing them from the "expo" package is no longer supported: ${instructions}`;
    messages = [];
    packages = [];
    namedImports = [];
    throw new Error(message);
}
//# sourceMappingURL=removedModule.js.map