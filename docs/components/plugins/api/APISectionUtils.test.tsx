import { render } from '@testing-library/react';

import type { CommentData } from './APIDataTypes';
import { CommentTextBlock, resolveTypeName } from './APISectionUtils';

import { attachEmotionSerializer } from '~/common/test-utilities';

attachEmotionSerializer(expect);

describe('APISectionUtils.resolveTypeName', () => {
  test('void', () => {
    const { container } = render(
      <>{resolveTypeName({ type: 'intrinsic', name: 'void' }, 'v49.0.0')}</>
    );
    expect(container).toMatchSnapshot();
  });

  test('generic type', () => {
    const { container } = render(
      <>{resolveTypeName({ type: 'intrinsic', name: 'string' }, 'v49.0.0')}</>
    );
    expect(container).toMatchSnapshot();
  });

  test('custom type', () => {
    const { container } = render(
      <>{resolveTypeName({ type: 'reference', name: 'SpeechSynthesisEvent' }, 'v49.0.0')}</>
    );
    expect(container).toMatchSnapshot();
  });

  test('custom type array', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'array',
            elementType: { type: 'reference', name: 'AppleAuthenticationScope' },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('custom type non-linkable array', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'array',
            elementType: { type: 'reference', name: 'T' },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('query type', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [{ queryType: { type: 'reference', name: 'View' }, type: 'query' }],
            name: 'React.ComponentProps',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('Promise', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [{ type: 'intrinsic', name: 'void' }],
            name: 'Promise',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('Promise with custom type', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [{ type: 'reference', name: 'AppleAuthenticationCredential' }],
            name: 'Promise',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('Record', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [
              { type: 'intrinsic', name: 'string' },
              { type: 'intrinsic', name: 'any' },
            ],
            name: 'Record',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('alternative generic object notation', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'array',
            elementType: {
              type: 'reflection',
              declaration: {
                name: '__type',
                indexSignature: {
                  name: '__index',
                  parameters: [
                    {
                      name: 'column',
                      type: { type: 'intrinsic', name: 'string' },
                    },
                  ],
                  type: { type: 'intrinsic', name: 'any' },
                },
              },
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('Record with union', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [
              { type: 'intrinsic', name: 'string' },
              {
                type: 'union',
                types: [
                  { type: 'intrinsic', name: 'number' },
                  { type: 'intrinsic', name: 'boolean' },
                  { type: 'intrinsic', name: 'string' },
                ],
              },
            ],
            name: 'Record',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('union', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'union',
            types: [
              { type: 'reference', name: 'SpeechEventCallback' },
              { type: 'literal', value: null },
            ],
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('union with array', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'union',
            types: [
              { type: 'array', elementType: { type: 'intrinsic', name: 'number' } },
              { type: 'literal', value: null },
            ],
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('union with custom type and array', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'union',
            types: [
              { type: 'array', elementType: { type: 'reference', name: 'AssetRef' } },
              { type: 'reference', name: 'AssetRef' },
            ],
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('union of array values', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'array',
            elementType: {
              type: 'union',
              types: [
                { type: 'reference', name: 'ResultSetError' },
                { type: 'reference', name: 'ResultSet' },
              ],
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('generic type', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [{ type: 'reference', name: 'Asset' }],
            name: 'PagedInfo',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('tuple type', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'tuple',
            elements: [
              { type: 'reference', name: 'SortByKey' },
              { type: 'intrinsic', name: 'boolean' },
            ],
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('generic type in Promise', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [
              {
                type: 'reference',
                typeArguments: [{ type: 'reference', name: 'Asset' }],
                name: 'PagedInfo',
              },
            ],
            name: 'Promise',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('function', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reflection',
            declaration: {
              signatures: [
                {
                  type: {
                    type: 'union',
                    types: [
                      { type: 'intrinsic', name: 'void' },
                      {
                        type: 'reference',
                        name: 'SpeechEventCallback',
                      },
                    ],
                  },
                },
              ],
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('function with arguments', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reflection',
            declaration: {
              signatures: [
                {
                  parameters: [
                    {
                      name: 'error',
                      type: { type: 'reference', name: 'Error' },
                    },
                  ],
                  type: {
                    type: 'union',
                    types: [
                      { type: 'intrinsic', name: 'void' },
                      { type: 'reference', name: 'SpeechEventCallback' },
                    ],
                  },
                },
              ],
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('function with non-linkable custom type', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reflection',
            declaration: {
              signatures: [
                {
                  parameters: [
                    {
                      name: 'error',
                      type: { type: 'reference', name: 'Error' },
                    },
                  ],
                  type: { type: 'intrinsic', name: 'void' },
                },
              ],
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('object reflection', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reflection',
            declaration: {
              children: [
                {
                  name: 'target',
                  type: { type: 'intrinsic', name: 'number' },
                },
                {
                  name: 'value',
                  type: { type: 'intrinsic', name: 'boolean' },
                },
              ],
            },
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('custom type with single pick', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [
              { type: 'reference', name: 'FontResource' },
              { type: 'literal', value: 'display' },
            ],
            name: 'Pick',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });

  test('props with multiple omits', () => {
    const { container } = render(
      <>
        {resolveTypeName(
          {
            type: 'reference',
            typeArguments: [
              {
                type: 'reference',
                typeArguments: [
                  { type: 'reference', name: 'ViewStyle' },
                  {
                    type: 'union',
                    types: [
                      { type: 'literal', value: 'backgroundColor' },
                      {
                        type: 'literal',
                        value: 'borderRadius',
                      },
                    ],
                  },
                ],
                name: 'Omit',
              },
            ],
            name: 'StyleProp',
          },
          'v49.0.0'
        )}
      </>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('APISectionUtils.CommentTextBlock component', () => {
  test('no comment', () => {
    const { container } = render(<CommentTextBlock comment={undefined} />);
    expect(container).toMatchSnapshot();
  });

  test('basic comment', () => {
    const comment: CommentData = {
      summary: [{ kind: 'text', text: 'This is the basic comment.' }],
    };

    const { container } = render(<CommentTextBlock comment={comment} />);
    expect(container).toMatchSnapshot();
  });

  test('comment with example', () => {
    const comment: CommentData = {
      summary: [
        {
          kind: 'text',
          text: 'Gets the referrer URL of the installed app with the [',
        },
        {
          kind: 'code',
          text: '`Install Referrer API`',
        },
        {
          kind: 'text',
          text: '](https://developer.android.com/google/play/installreferrer)\nfrom the Google Play Store. In practice, the referrer URL may not be a complete, absolute URL.',
        },
      ],
      blockTags: [
        {
          tag: '@returns',
          content: [
            {
              kind: 'text',
              text: 'A ',
            },
            {
              kind: 'code',
              text: '`Promise`',
            },
            {
              kind: 'text',
              text: ' that fulfills with a ',
            },
            {
              kind: 'code',
              text: '`string`',
            },
            {
              kind: 'text',
              text: ' of the referrer URL of the installed app.',
            },
          ],
        },
        {
          tag: '@example',
          content: [
            {
              kind: 'code',
              text: '```ts\nawait Application.getInstallReferrerAsync();\n// "utm_source=google-play&utm_medium=organic"\n```',
            },
          ],
        },
        {
          tag: '@platform',
          content: [
            {
              kind: 'text',
              text: 'android',
            },
          ],
        },
      ],
    };

    const { container } = render(<CommentTextBlock comment={comment} />);
    expect(container).toMatchSnapshot();
  });
});
