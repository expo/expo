let messages = [];
let packages = [];
let namedImports = [];
let extraInstructions = [];
export default function deprecatedModule(message, namedImport, packageName, extraInstruction) {
    if (__DEV__) {
        messages.push(message);
        packages.push(packageName);
        namedImports.push(namedImport);
        if (extraInstruction) {
            extraInstructions.push(extraInstruction);
        }
        setTimeout(logWarning, 1000);
    }
}
function logWarning() {
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
    extraInstructions = Array.from(new Set(extraInstructions));
    extraInstructions.sort();
    instructions += namedImports.join(', ');
    instructions += `.\n\n`;
    instructions += `1. Add correct versions of these packages to your project using:\n\n`;
    instructions += `   expo install ${packages.join(' ')}\n\n`;
    instructions += `   If "install" is not recognized as an expo command, update your expo-cli installation.\n\n`;
    instructions += `2. Change your imports so they use specific packages instead of the "expo" package:\n\n`;
    messages.forEach(message => {
        instructions += ` - ${message}\n`;
    });
    if (extraInstructions.length) {
        instructions += `3. Make the following other changes:\n\n`;
        extraInstructions.forEach(instruction => {
            instructions += ` - ${instruction}\n`;
        });
    }
    instructions += '\n';
    console.log(`The following APIs have moved to separate packages and importing them from the "expo" package is deprecated: ${instructions}`);
    messages = [];
    packages = [];
    namedImports = [];
}
//# sourceMappingURL=deprecatedModule.js.map