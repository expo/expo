let messages: string[] = [];
let packages: string[] = [];
let namedImports: string[] = [];
let extraInstructions: string[] = [];

export default function deprecatedGlobal(message, namedImport, packageName, extraInstruction?) {
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
  instructions += `If you are not using the __expo or Expo globals in your
  project directly, then they may used from one of your dependencies. Search
  your node_modules to find which library is using these dependencies and
  either upgrade the library, open an issue, or use patch-package to work
  around this.\n\n`;

  if (extraInstructions.length) {
    instructions += `Additional instructions:\n\n`;
    extraInstructions.forEach(instruction => {
      instructions += ` - ${instruction}\n`;
    });
  }

  instructions += '\n';
  console.log(
    `The following APIs that you are using will no longer be exposed globally by the "expo" package in SDK 41: ${instructions}`
  );
  messages = [];
  packages = [];
  namedImports = [];
}
