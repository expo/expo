import { mobile } from '@e2e-dev/mobile';
import type { E2EConfig } from 'e2e';
import { chatgpt } from 'e2e/oauth/chatgpt';

const app = { bundleId: 'dev.expo.routertester' };

export default {
  // Uses the ChatGPT login from `e2e login openai`, or `E2E_OAUTH_CREDENTIALS` in CI.
  agents: { default: { model: chatgpt('gpt-6-luna') } },
  targets: [
    { name: 'ios', engine: mobile({ platform: 'ios' }), app },
    { name: 'android', engine: mobile({ platform: 'android' }), app },
  ],
  workers: 1,
} satisfies E2EConfig;
