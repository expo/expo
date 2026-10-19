type BuildNativeUpgradePromptParams = {
  from: string;
  to: string;
  diff: string;
  url?: string;
};

export function buildUpgradeInstructions(from: string, to: string) {
  return `Upgrade my Expo React Native project from SDK ${from} to SDK ${to}. Below is the unified diff of every file that changed in the expo-template-bare-minimum template between these two SDK versions. It covers the native android/ and ios/ directories as well as project-root files such as package.json. Apply every change in this diff to the corresponding file in my project. My project is NOT identical to the template, so adapt file paths, reconcile conflicts, skip changes already present, preserve my custom code, and do not assume a clean \`git apply\`. When done, summarize what you changed.`;
}

export function buildUpgradeHelperAttribution(url: string) {
  return `Generated with the Expo native upgrade helper: ${url}`;
}

export function buildNativeUpgradePrompt({ from, to, diff, url }: BuildNativeUpgradePromptParams) {
  const prompt = `${buildUpgradeInstructions(from, to)}\n\n${diff}`;

  if (!url) {
    return prompt;
  }

  return `${prompt}\n\n${buildUpgradeHelperAttribution(url)}`;
}
