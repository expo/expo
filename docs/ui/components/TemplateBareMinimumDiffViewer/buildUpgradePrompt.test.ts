import { buildNativeUpgradePrompt } from './buildUpgradePrompt';

const DIFF = `diff --git a/templates/expo-template-bare-minimum/android/app/build.gradle b/templates/expo-template-bare-minimum/android/app/build.gradle
index 1111111..2222222 100644
--- a/templates/expo-template-bare-minimum/android/app/build.gradle
+++ b/templates/expo-template-bare-minimum/android/app/build.gradle
@@ -1,3 +1,3 @@
 android {
-    compileSdkVersion 34
+    compileSdkVersion 35
 }`;

describe('buildNativeUpgradePrompt', () => {
  it('states the upgrade goal with the selected from and to SDK versions', () => {
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF });

    expect(prompt).toContain('from SDK 55 to SDK 56');
  });

  it('includes the apply instructions that adapt the template to a real project', () => {
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF });

    expect(prompt).toContain('android/ and ios/ directories');
    expect(prompt).toContain('My project is NOT identical to the template');
    expect(prompt).toContain('do not assume a clean `git apply`');
    expect(prompt).toContain('summarize what you changed');
  });

  it('tells the agent to apply changes outside android/ and ios/, such as package.json', () => {
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF });

    expect(prompt).toContain('package.json');
  });

  it('embeds the full raw diff after the instructions', () => {
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF });

    expect(prompt).toContain(DIFF);
    expect(prompt.indexOf('summarize what you changed')).toBeLessThan(prompt.indexOf(DIFF));
  });

  it('appends a reference line with the version-pinned page URL after the diff', () => {
    const url = 'https://docs.expo.dev/bare/upgrade?fromSdk=55&toSdk=56';
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF, url });

    expect(prompt).toContain(url);
    expect(prompt.indexOf(DIFF)).toBeLessThan(prompt.indexOf(url));
  });

  it('omits the reference line when no URL is provided, ending with the diff', () => {
    const prompt = buildNativeUpgradePrompt({ from: '55', to: '56', diff: DIFF });

    expect(prompt.endsWith(DIFF)).toBe(true);
  });
});
