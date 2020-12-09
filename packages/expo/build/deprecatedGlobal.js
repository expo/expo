let packages = [];
let namedImports = [];
let extraInstructions = [];
export default function deprecatedGlobal(namedImport, packageName, extraInstruction) {
    if (__DEV__) {
        packages.push(packageName);
        namedImports.push(namedImport);
        if (extraInstruction) {
            extraInstructions.push(extraInstruction);
        }
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
    namedImports = Array.from(new Set(namedImports));
    namedImports.sort();
    extraInstructions = Array.from(new Set(extraInstructions));
    extraInstructions.sort();
    instructions += namedImports.join(', ');
    instructions += `.\n\n`;
    instructions += `If you are not using global.Expo or global.__expo directly in your source code, then they may used in one of your dependencies.\n`;
    instructions += `Learn more: https://expo.fyi/deprecated-globals`;
    if (extraInstructions.length) {
        instructions += `Additional instructions:\n\n`;
        extraInstructions.forEach(instruction => {
            instructions += ` - ${instruction}\n`;
        });
    }
    instructions += '\n';
    console.warn(`Your project is accessing the following APIs from a deprecated global rather than a module import: ${instructions}`);
    packages = [];
    namedImports = [];
}
//# sourceMappingURL=deprecatedGlobal.js.map