let messages: string[] = [];
let packages: string[] = [];

export default function deprecatedModule(message, packageName) {
  if (__DEV__) {
    messages.push(message);
    packages.push(packageName);
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

  messages.forEach(message => {
    instructions += `- ${message}';\n`;
  });
  instructions += '\n';
  instructions += 'You can add the correct versions of these packages to your project using:\n';
  instructions += `expo install ${packages.join(' ')}`;
  console.log(
    `Following APIs have moved to separate packages and importing them from the 'expo' package is deprecated:\n${instructions}`
  );
  messages = [];
  packages = [];
}
