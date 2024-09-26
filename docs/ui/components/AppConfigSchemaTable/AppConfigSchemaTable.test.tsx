import { screen } from '@testing-library/react';

import AppConfigSchemaTable from './';
import { formatSchema, createDescription } from './helpers';
import { Property } from './types';

import { attachEmotionSerializer, renderWithHeadings } from '~/common/test-utilities';

const TEST_SCHEMA: Record<string, Property> = {
  name: {
    description: 'Name of your app.',
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
        meta: {
          expoKit: 'Set this property using Xcode.',
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
    meta: {
      expoKit: 'Set this property using AppConstants.java.',
      bareWorkflow: 'Set this property using just Xcode',
    },
  },
  intentFilters: {
    description: 'Configuration for setting an array of custom intent filters in Android manifest.',
    example: [
      {
        autoVerify: true,
        data: {
          host: '*.example.com',
        },
      },
    ],
    exampleString: '\n [{ \n "autoVerify": true, \n "data": {"host": "*.example.com" \n } \n }]',
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
              host: { description: 'the host, e.g. `example.com`', type: 'string' },
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
    meta: {
      bareWorkflow: 'This is set in AndroidManifest.xml directly.',
    },
  },
};

describe('AppConfigSchemaPropertiesTable', () => {
  attachEmotionSerializer(expect);

  test('correctly matches snapshot', () => {
    const { container } = renderWithHeadings(<AppConfigSchemaTable schema={TEST_SCHEMA} />);
    expect(container).toMatchSnapshot();
  });

  test('description includes all required components', () => {
    renderWithHeadings(
      <AppConfigSchemaTable schema={{ entry: TEST_SCHEMA.androidNavigationBar }} />
    );

    expect(screen.getByText('Specifies the background color of the navigation bar.'));
    expect(screen.getByText('6 character long hex color string, eg:'));
    expect(screen.getByText('Set this property using just Xcode'));
    expect(screen.getByText('Set this property using AppConstants.java.'));
  });
});

describe('formatSchema', () => {
  const formattedSchema = formatSchema(Object.entries(TEST_SCHEMA));
  test('name is property at root level', () => {
    expect(formattedSchema[0].name).toBe('name');
  });
  test('androidNavigationBar has two subproperties', () => {
    expect(formattedSchema[1].subproperties.length).toBe(2);
  });
  test('visible is androidNavigationBar subproperty', () => {
    expect(formattedSchema[1].subproperties[0].name).toBe('visible');
  });
  test('always is visible subproperty', () => {
    expect(formattedSchema[1].subproperties[0].subproperties[0].name).toBe('always');
  });
  test('backgroundColor is androidNavigationBar subproperty', () => {
    expect(formattedSchema[1].subproperties[1].name).toBe('backgroundColor');
  });
  test('intentFilters is property at root level', () => {
    expect(formattedSchema[2].name).toBe('intentFilters');
  });
  test('autoVerify is intentFilters subproperty', () => {
    expect(formattedSchema[2].subproperties[0].name).toBe('autoVerify');
  });
  test('data is intentFilters subproperty', () => {
    expect(formattedSchema[2].subproperties[1].name).toBe('data');
  });
  test('host is data subproperty', () => {
    expect(formattedSchema[2].subproperties[1].subproperties[0].name).toBe('host');
  });
});

describe('createDescription', () => {
  test('type and description are rendered correctly', () => {
    const intentFiltersObject = Object.entries(TEST_SCHEMA)[2];
    const intentFiltersObjectValue = intentFiltersObject[1] as any;
    const result = createDescription(intentFiltersObject);

    expect(result).toBe(`${intentFiltersObjectValue.description}`);
  });

  test('regexHuman is added correctly', () => {
    //Note: to access this subproperty is tedious without a call to formatSchema
    const backgroundColorObject = Object.entries(Object.values(TEST_SCHEMA)[1].properties!)[1];
    const backgroundColorObjectValue = backgroundColorObject[1];
    const result = createDescription(backgroundColorObject);

    expect(result).toBe(
      `${backgroundColorObjectValue.description}\n\n${backgroundColorObjectValue.meta!.regexHuman}`
    );
  });
});
