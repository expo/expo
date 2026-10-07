/** @jest-environment node */
import { expect, jest, test } from '@jest/globals';

import type { recoverNotFoundAsync } from '../../worker/url-recovery.ts';
import {
  chooseHierarchicalAsync,
  hierarchyOptions,
  recoverHierarchicalAsync,
} from './hierarchical.ts';

type Ai = NonNullable<Parameters<typeof recoverNotFoundAsync>[1]['AI']>;
type Input = Parameters<Ai['run']>[1];
const page = (path: string) => ({
  path,
  title: `Title ${path}`,
  description: 'Expo documentation',
});
const inventory = [
  ...Array.from({ length: 253 }, (_, index) => page(`/guides/page-${index}/`)),
  page('/router/introduction/'),
  page('/router/navigation/'),
];

function mockAi(choices: { choice: string; confidence?: number }[]) {
  const calls: { input: Input; signal: AbortSignal }[] = [];
  const ai: Ai = {
    async run(_model, input, { signal }) {
      const answer = choices[calls.length];
      calls.push({ input, signal });
      return {
        state: 'Completed',
        result: {
          answers: {
            destination: {
              type: 'choice',
              choice: answer.choice,
              confidence: answer.confidence ?? 0.9,
              probabilities: Object.fromEntries(
                Object.keys(input.questions.destination.criteria).map(option => [
                  option,
                  option === answer.choice ? 1 : 0,
                ])
              ),
            },
          },
        },
      };
    },
  };
  return { ai, calls };
}

test('selects sections by topic even when the requested directory is wrong', async () => {
  const { ai, calls } = mockAi([
    { choice: 'section:/router/', confidence: 0.4 },
    { choice: '/router/introduction/' },
  ]);
  await expect(chooseHierarchicalAsync('/guides/route-introduction/', inventory, ai)).resolves.toBe(
    '/router/introduction/'
  );
  expect(calls).toHaveLength(2);
  expect(calls[0].input.questions.destination.criteria['section:/guides/']).toContain(
    'Title /guides/page-252/'
  );
  expect(Object.keys(calls[1].input.questions.destination.criteria)).toEqual([
    '/router/introduction/',
    '/router/navigation/',
    'none_of_the_above',
  ]);
  expect(calls[0].signal).toBe(calls[1].signal);
  expect(calls.every(call => call.input.state.path === '/guides/route-introduction/')).toBe(true);
  expect(
    calls.every(call => Object.keys(call.input.questions.destination.criteria).length <= 255)
  ).toBe(true);
});

test('uses all 255 Choice options for exactly 254 pages and no match', async () => {
  const pages = Array.from({ length: 254 }, (_, index) => page(`/page-${index}/`));
  const { ai, calls } = mockAi([{ choice: pages[253].path }]);
  await expect(chooseHierarchicalAsync('/missing/', pages, ai)).resolves.toBe(pages[253].path);
  expect(calls).toHaveLength(1);
  expect(Object.keys(calls[0].input.questions.destination.criteria)).toEqual([
    ...pages.map(page => page.path),
    'none_of_the_above',
  ]);
});

test('does not start another inference after the shared deadline expires', async () => {
  const controller = new AbortController();
  const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  const { ai, calls } = mockAi([{ choice: 'section:/router/' }]);
  const run = ai.run;
  ai.run = async (...args) => {
    const response = await run(...args);
    controller.abort(new Error('Inference deadline expired'));
    return response;
  };
  try {
    await expect(chooseHierarchicalAsync('/missing/', inventory, ai)).rejects.toThrow(
      'Inference deadline expired'
    );
    expect(timeout).toHaveBeenCalledWith(3000);
    expect(calls).toHaveLength(1);
  } finally {
    timeout.mockRestore();
  }
});

test('permits no match at either level and applies the production confidence threshold to leaves', async () => {
  for (const choices of [
    [{ choice: 'none_of_the_above' }],
    [{ choice: 'section:/router/' }, { choice: 'none_of_the_above' }],
    [{ choice: 'section:/router/' }, { choice: '/router/introduction/', confidence: 0.49 }],
  ]) {
    const { ai, calls } = mockAi(choices);
    await expect(chooseHierarchicalAsync('/router/missing/', inventory, ai)).resolves.toBeNull();
    expect(calls).toHaveLength(choices.length);
  }
});

test('retains the baseline locale and SDK version eligibility rules', async () => {
  const pages = [
    page('/'),
    page('/guides/permissions/'),
    page('/versions/latest/sdk/camera/'),
    page('/versions/v54.0.0/sdk/camera/'),
    page('/ja/guides/permissions/'),
    page('/ja/versions/latest/sdk/camera/'),
  ];
  for (const [path, expected] of [
    ['/versions/v54.0.0/sdk/camra/', ['/guides/permissions/', '/versions/v54.0.0/sdk/camera/']],
    ['/guides/camra/', ['/guides/permissions/', '/versions/latest/sdk/camera/']],
    ['/ja/guides/camra/', ['/ja/guides/permissions/', '/ja/versions/latest/sdk/camera/']],
  ] as const) {
    const { ai, calls } = mockAi([{ choice: 'none_of_the_above' }]);
    await chooseHierarchicalAsync(path, pages, ai);
    expect(Object.keys(calls[0].input.questions.destination.criteria)).toEqual([
      ...expected,
      'none_of_the_above',
    ]);
  }
  const { ai, calls } = mockAi([]);
  await expect(chooseHierarchicalAsync('/guides/permissions/', pages, ai)).resolves.toBeNull();
  await expect(chooseHierarchicalAsync('/ja/missing/', inventory, ai)).resolves.toBeNull();
  expect(calls).toHaveLength(0);
});

test('compresses namespace-only levels and preserves section landing pages', () => {
  const pages = [
    page('/versions/latest/sdk/'),
    ...Array.from({ length: 255 }, (_, index) =>
      page(`/versions/latest/sdk/group-${index % 3}/page-${index}/`)
    ),
  ];
  const options = hierarchyOptions(pages);
  expect(options.map(option => option.id)).toEqual([
    '/versions/latest/sdk/',
    'section:/versions/latest/sdk/group-0/',
    'section:/versions/latest/sdk/group-1/',
    'section:/versions/latest/sdk/group-2/',
  ]);
  expect(options.flatMap(option => option.pages)).toHaveLength(pages.length);
});

test('fails rather than silently dropping candidates when siblings exceed the Choice limit', () => {
  expect(() =>
    hierarchyOptions(Array.from({ length: 255 }, (_, index) => page(`/page-${index}/`)))
  ).toThrow('exceeds 254 sibling options');
});

test('rejects malformed provider answers instead of counting them as abstentions', async () => {
  for (const response of [
    { state: 'Pending' },
    { answers: {} },
    {
      answers: {
        destination: {
          type: 'choice',
          choice: '/unknown/',
          confidence: 0.9,
          probabilities: {},
        },
      },
    },
  ]) {
    await expect(
      chooseHierarchicalAsync('/missing/', inventory, { run: async () => response })
    ).rejects.toThrow(/Jev/);
  }
});

test('applies production request eligibility before loading the inventory or calling Jev', async () => {
  const { ai, calls } = mockAi([]);
  const env = {
    AI: ai,
    ASSETS: {
      async fetch() {
        throw new Error('Ineligible requests must not fetch assets');
      },
    },
  };
  for (const path of ['/api/missing/', '/page.with-dot/', `/${'a'.repeat(512)}/`]) {
    await expect(
      recoverHierarchicalAsync(new Request(`https://docs.expo.dev${path}`), env)
    ).resolves.toBeNull();
  }
  await expect(
    recoverHierarchicalAsync(new Request('https://docs.expo.dev/missing/', { method: 'POST' }), env)
  ).resolves.toBeNull();
  expect(calls).toHaveLength(0);
});
