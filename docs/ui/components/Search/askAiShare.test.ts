/**
 * @jest-environment node
 */
import {
  ASK_AI_SHARE_HASH_PARAM,
  buildSharedFollowUpQuery,
  decodeAskAiShare,
  encodeAskAiShare,
  extractUserQuestion,
  parseAskAiShareHash,
  type SharedAskAiEntry,
} from '@expo/styleguide-search-ui';
import { deflateRawSync } from 'node:zlib';

const REALISTIC_ANSWER = `Expo Go vs Development Builds

Here's a quick breakdown of the key differences:

Expo Go

- A **pre-built sandbox app** you download from the App Store/Play Store
- Great for **learning, prototyping, and quick experiments**
- No Xcode or Android Studio required, just scan a QR code
- Comes with a **fixed set of pre-installed native libraries**
- Limitations:
  - Cannot use third-party libraries with native code not bundled in Expo Go
  - Doesn't accurately simulate push notifications, OAuth, deep linking, maps, or features requiring API keys passed to native code
  - Doesn't use your app's package name/bundle identifier, so behavior may differ from production
  - Only supports one SDK version at a time. Source: [Expo Go vs Dev Builds](https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/)

Development Builds

- A build of **your own app** that includes the \`expo-dev-client\` library
- Supports **any native library**, config plugins, and custom native code
- Uses your real bundle identifier and entitlements, so push notifications and deep links behave like production
- Requires a build step:

\`\`\`bash
npx expo install expo-dev-client
eas build --profile development --platform ios
\`\`\`

- Recommended for any project beyond quick experiments. Source: [Create a development build](https://docs.expo.dev/develop/development-builds/create-a-build/)

In short: start with Expo Go to learn, switch to a development build when your app needs libraries or behavior Expo Go can't provide.`;

const SAMPLE_ENTRY: SharedAskAiEntry = {
  question: 'dev builds vs expo go',
  answer: REALISTIC_ANSWER,
};

function base64UrlFromBytes(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64url');
}

describe('encodeAskAiShare', () => {
  it('produces a v1-tagged fragment value that round-trips', async () => {
    const encoded = await encodeAskAiShare(SAMPLE_ENTRY);

    expect(encoded).toMatch(/^v1\.[\w-]+$/);
    await expect(decodeAskAiShare(encoded)).resolves.toEqual(SAMPLE_ENTRY);
  });

  it('round-trips a short entry', async () => {
    const entry: SharedAskAiEntry = {
      question: 'what is eas?',
      answer: 'Expo Application Services.',
    };

    await expect(decodeAskAiShare(await encodeAskAiShare(entry))).resolves.toEqual(entry);
  });

  it('keeps a realistic share URL comfortably under 2000 characters', async () => {
    const encoded = await encodeAskAiShare(SAMPLE_ENTRY);
    const url = `https://docs.expo.dev/develop/development-builds/introduction/#${ASK_AI_SHARE_HASH_PARAM}=${encoded}`;

    console.info(`share URL length for realistic answer: ${url.length}`);
    expect(url.length).toBeLessThan(2000);
  });

  it('rejects oversized answers instead of building unusable URLs', async () => {
    const entry: SharedAskAiEntry = { question: 'q', answer: 'a'.repeat(50_000) };

    await expect(encodeAskAiShare(entry)).rejects.toThrow();
  });
});

describe('decodeAskAiShare', () => {
  it.each([
    ['empty string', ''],
    ['not a payload', 'not-a-payload'],
    ['bad base64 payload', 'v1.!!!'],
    ['unknown version', 'v9.abc'],
    ['truncated payload', 'v1.AAAA'],
  ])('returns null for %s', async (_label, value) => {
    await expect(decodeAskAiShare(value)).resolves.toBeNull();
  });

  it('returns null for a valid deflate stream carrying the wrong shape', async () => {
    const bytes = deflateRawSync(Buffer.from(JSON.stringify({ nope: true }), 'utf8'));
    const forged = `v1.${base64UrlFromBytes(bytes)}`;

    await expect(decodeAskAiShare(forged)).resolves.toBeNull();
  });

  it('returns null when fields exceed the decode caps', async () => {
    const bytes = deflateRawSync(
      Buffer.from(JSON.stringify({ v: 1, q: 'q'.repeat(3000), a: 'a' }), 'utf8')
    );
    const forged = `v1.${base64UrlFromBytes(bytes)}`;

    await expect(decodeAskAiShare(forged)).resolves.toBeNull();
  });
});

describe('buildSharedFollowUpQuery', () => {
  it('embeds the shared question, answer, and the follow-up behind the marker', () => {
    const wrapped = buildSharedFollowUpQuery(SAMPLE_ENTRY, 'how do I configure it?');

    expect(wrapped).toContain(SAMPLE_ENTRY.question);
    expect(wrapped).toContain('pre-built sandbox app');
    expect(wrapped).toMatch(/Follow-up question: how do I configure it\?$/);
  });

  it('caps oversized shared answers instead of forwarding them whole', () => {
    const entry: SharedAskAiEntry = { question: 'q', answer: 'a'.repeat(30_000) };
    const wrapped = buildSharedFollowUpQuery(entry, 'follow up');

    expect(wrapped.length).toBeLessThan(10_000);
    expect(wrapped).toMatch(/Follow-up question: follow up$/);
  });
});

describe('extractUserQuestion', () => {
  it('returns plain questions unchanged', () => {
    expect(extractUserQuestion('dev builds vs expo go')).toBe('dev builds vs expo go');
  });

  it('extracts the raw follow-up from a wrapped query', () => {
    const wrapped = buildSharedFollowUpQuery(SAMPLE_ENTRY, 'how do I configure it?');

    expect(extractUserQuestion(wrapped)).toBe('how do I configure it?');
  });
});

describe('parseAskAiShareHash', () => {
  it('extracts the payload from a share hash', () => {
    expect(parseAskAiShareHash(`#${ASK_AI_SHARE_HASH_PARAM}=v1.abc`)).toBe('v1.abc');
  });

  it.each([
    ['empty hash', ''],
    ['unrelated hash', '#installation'],
    ['missing value', `#${ASK_AI_SHARE_HASH_PARAM}=`],
  ])('returns null for %s', (_label, hash) => {
    expect(parseAskAiShareHash(hash)).toBeNull();
  });
});
