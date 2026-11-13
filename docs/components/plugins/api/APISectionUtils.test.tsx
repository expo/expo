import { render, screen } from '@testing-library/react';

import { APISectionPackageContext, resolveTypeName } from './APISectionUtils';

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
                indexSignatures: [
                  {
                    name: '__index',
                    parameters: [
                      {
                        name: 'column',
                        type: { type: 'intrinsic', name: 'string' },
                      },
                    ],
                    type: { type: 'intrinsic', name: 'any' },
                  },
                ],
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

  describe('on a page that declares a Date type', () => {
    const renderOnPage = (typeDefinition: Parameters<typeof resolveTypeName>[0]) =>
      render(
        <APISectionPackageContext.Provider
          value={{ packageNames: ['expo-contacts'], typeNames: new Set(['Date']) }}>
          {resolveTypeName(typeDefinition, 'v58.0.0')}
        </APISectionPackageContext.Provider>
      );

    test('library type with the name of a global type', () => {
      renderOnPage({ type: 'reference', name: 'Date', package: 'expo-contacts' });
      expect(screen.getByRole('link', { name: 'Date' })).toHaveAttribute('href', '#date');
    });

    test('array of a library type with the name of a global type', () => {
      renderOnPage({
        type: 'array',
        elementType: { type: 'reference', name: 'Date', package: 'expo-contacts' },
      });
      expect(screen.getByRole('link', { name: 'Date[]' })).toHaveAttribute('href', '#date');
    });

    test('type of another package with the name of a global type', () => {
      renderOnPage({ type: 'reference', name: 'MouseEvent', package: '@types/react' });
      expect(screen.getByRole('link', { name: 'MouseEvent' })).toHaveAttribute(
        'href',
        'https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent'
      );
    });
  });
});
