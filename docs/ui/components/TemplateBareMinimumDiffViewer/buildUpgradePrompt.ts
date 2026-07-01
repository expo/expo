type BuildNativeUpgradePromptParams = {
  from: string;
  to: string;
  diff: string;
  url?: string;
};

export function buildNativeUpgradePrompt({ from, to, diff, url }: BuildNativeUpgradePromptParams) {
  const instructions = `Upgrade my Expo React Native project's native code from SDK ${from} to SDK ${to}. Below is the unified diff of every native file change between expo-template-bare-minimum for these two SDK versions. Apply these changes to my android/ and ios/ directories. My project is NOT identical to the template, so adapt file paths, reconcile conflicts, skip changes already present, and preserve my custom native code - do not assume a clean \`git apply\`. When done, summarize what you changed.`;

  const prompt = `${instructions}\n\n${diff}`;

  if (!url) {
    return prompt;
  }

  return `${prompt}\n\nGenerated with the Expo native upgrade helper: ${url}`;
}
