import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NativeUpgradePromptCallout } from './NativeUpgradePromptCallout';

const DIFF = `diff --git a/templates/expo-template-bare-minimum/android/app/build.gradle b/templates/expo-template-bare-minimum/android/app/build.gradle
index 1111111..2222222 100644
--- a/templates/expo-template-bare-minimum/android/app/build.gradle
+++ b/templates/expo-template-bare-minimum/android/app/build.gradle
@@ -1,3 +1,3 @@
 android {
-    compileSdkVersion 34
+    compileSdkVersion 35
 }`;

function setupClipboard() {
  const writeText = jest.fn();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

describe('NativeUpgradePromptCallout', () => {
  it('renders nothing when the diff is empty', () => {
    setupClipboard();

    const { container } = render(
      <NativeUpgradePromptCallout fromVersion="52" toVersion="53" diff="" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('explains that the prompt can be handed to an AI agent', () => {
    setupClipboard();

    render(<NativeUpgradePromptCallout fromVersion="52" toVersion="53" diff={DIFF} />);

    expect(screen.getByText(/ai agent/i)).toBeInTheDocument();
  });

  it('copies an agent-runnable prompt with instructions, the diff, and a version-pinned URL', async () => {
    const writeText = setupClipboard();

    render(<NativeUpgradePromptCallout fromVersion="52" toVersion="53" diff={DIFF} />);

    fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('from SDK 52 to SDK 53');
    expect(copied).toContain(DIFF);
    expect(copied).toContain('fromSdk=52&toSdk=53');
  });

  it('shows copied feedback after copying the prompt', async () => {
    setupClipboard();

    render(<NativeUpgradePromptCallout fromVersion="52" toVersion="53" diff={DIFF} />);

    fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });
});
