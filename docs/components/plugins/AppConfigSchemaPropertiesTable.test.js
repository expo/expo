import { render } from '@testing-library/react';
import AppConfigSchemaPropertiesTable from './AppConfigSchemaPropertiesTable';
import { SluggerContext } from '~/components/page-higher-order/withSlugger';
import GithubSlugger from 'github-slugger';

var testSchema = {
  name: {
    description: 'Name of your app. ',
    type: 'string',
    meta: {
      bareWorkflow: "Edit the 'Display Name' field in Xcode",
    },
  },
  androidNavigationBar: {
    description: 'Configuration for the bottom navigation bar on Android.',
    type: 'object',
    properties: {
      visible: {
        description: 'Determines how and when the navigation bar is shown.',
        type: 'string',
        properties: {
          always: {
            description: 'Test sub-sub-property',
            type: 'boolean',
          },
        },
        enum: ['leanback', 'immersive', 'sticky-immersive'],
      },
      backgroundColor: {
        description: 'Specifies the background color of the navigation bar. ',
        type: 'string',
        pattern: '^#|(&#x23;)\\d{6}$',
        meta: {
          regexHuman: "6 character long hex color string, eg: `'#000000'`",
        },
      },
    },
  },
  intentFilters: {
    description: 'Configuration for setting an array of custom intent filters in Android manifest.',
    example: [
      {
        autoVerify: true,
        data: {
          host: '*.expo.io',
        },
      },
    ],
    exampleString: '\n [{ \n "autoVerify": true, \n "data": {"host": "*.expo.io" \n } \n }]',
    type: 'array',
    uniqueItems: true,
    items: {
      type: 'object',
      properties: {
        autoVerify: {
          description:
            'You may also use an intent filter to set your app as the default handler for links',
          type: 'boolean',
        },
        data: {
          type: ['array', 'object'],
          items: {
            type: 'object',
            properties: {
              host: { description: 'the host, e.g. `myapp.io`', type: 'string' },
            },
            additionalProperties: false,
          },
          properties: {
            host: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
      required: ['action'],
    },
  },
};

test('correct property and subproperty indent styling', () => {
  const { getByTestId } = render(
    <SluggerContext.Provider value={new GithubSlugger()}>
      <AppConfigSchemaPropertiesTable schema={testSchema} />
    </SluggerContext.Provider>
  );

  const level_0_style = `
    marginLeft: 12px,
    display: 'block',
    listStyleType: 'circle',
    width: 'fit-content',
    overflowX: 'visible',
  `;

  const level_1_style = `
    marginLeft: 44px,
    display: 'inline',
    listStyleType: 'default',
    width: 'fit-content',
    overflowX: 'visible',
  `;

  const level_2_style = `
    marginLeft: 76px,
    display: 'inline',
    listStyleType: 'circle',
    width: 'fit-content',
    overflowX: 'visible',
  `;

  //level-0 property
  //the #### is added to link this property name by markdown and included in the data-testid
  expect(getByTestId('#### `name`')).toHaveStyle(level_0_style);

  //level-0 property
  expect(getByTestId('#### `androidNavigationBar`')).toHaveStyle(level_0_style);

  //level-1 subproperty
  expect(getByTestId('`visible`')).toHaveStyle(level_1_style);

  //level-2 subproperty
  expect(getByTestId('`always`')).toHaveStyle(level_2_style);

  //level-1 subproperty
  expect(getByTestId('`backgroundColor`')).toHaveStyle(level_1_style);

  //level-0 property
  expect(getByTestId('#### `intentFilters`')).toHaveStyle(level_0_style);

  //level-1 subproperty
  expect(getByTestId('`autoVerify`')).toHaveStyle(level_1_style);

  //level-1 subproperty
  expect(getByTestId('`data`')).toHaveStyle(level_1_style);

  //level-2 subproperty
  expect(getByTestId('`host`')).toHaveStyle(level_2_style);
});

test('correct description add-ons (bareWorkflow, regexHuman, etc.)', () => {
  const { container } = render(
    <SluggerContext.Provider value={new GithubSlugger()}>
      <AppConfigSchemaPropertiesTable schema={testSchema} />
    </SluggerContext.Provider>
  );

  const name_description =
    "Name of your app. Bare workflow: Edit the 'Display Name' field in Xcode";

  const backgroundColor_description =
    "Specifies the background color of the navigation bar. 6 character long hex color string, eg: '#000000'";

  const intentFilters_description =
    'Configuration for setting an array of custom intent filters in Android manifest. [{ "autoVerify": true, "data": {"host": "*.expo.io" } }]';

  expect(container).toHaveTextContent(name_description);
  expect(container).toHaveTextContent(backgroundColor_description);
  expect(container).toHaveTextContent(intentFilters_description);
});

test('correct enum type value', () => {
  const { container } = render(
    <SluggerContext.Provider value={new GithubSlugger()}>
      <AppConfigSchemaPropertiesTable schema={testSchema} />
    </SluggerContext.Provider>
  );

  //the two words in the Property and Type td columns run together in raw TextContent
  expect(container).toHaveTextContent('visibleenum');
});
