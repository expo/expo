import { screen } from '@testing-library/react';

import { renderWithHeadings } from '~/common/test-utilities';

import AppConfigSchemaTable from './';
import { formatSchema, createDescription } from './helpers';
import { Property } from './types';

const TEST_SCHEMA: Record<string, Property> = {
  name: {
    description: 'Name of your app.',
    type: 'string',
    meta: {
      bareWorkflow: "Edit the 'Display Name' field in Xcode",
    },
  },
  splash: {
    description: 'Configuration for loading and splash screen for standalone apps.',
    type: 'object',
    properties: {
      resizeMode: {
        description: 'Determines how the image will be displayed in the splash loading screen.',
        type: 'string',
        properties: {
          always: {
            description: 'Test sub-sub-property',
            type: 'boolean',
          },
        },
        enum: ['cover', 'contain'],
      },
      backgroundColor: {
        description: 'Color to fill the loading screen background. ',
        type: 'string',
        pattern: '^#|(&#x23;)\\d{6}$',
        meta: {
          regexHuman: "6 character long hex color string, eg: `'#000000'`",
        },
      },
    },
    meta: {
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
  test('correctly matches snapshot', () => {
    const { container } = renderWithHeadings(<AppConfigSchemaTable schema={TEST_SCHEMA} />);
    expect(container).toMatchSnapshot();
  });

  test('description includes all required components', () => {
    renderWithHeadings(<AppConfigSchemaTable schema={{ entry: TEST_SCHEMA.splash }} />);

    expect(screen.getByText('Color to fill the loading screen background.'));
    expect(screen.getByText('6 character long hex color string, eg:'));
  });
});

describe('formatSchema', () => {
  const formattedSchema = formatSchema(Object.entries(TEST_SCHEMA));
  test('name is property at root level', () => {
    expect(formattedSchema[0].name).toBe('name');
  });
  test('splash has two subproperties', () => {
    expect(formattedSchema[1].subproperties.length).toBe(2);
  });
  test('resizeMode is splash subproperty', () => {
    expect(formattedSchema[1].subproperties[0].name).toBe('resizeMode');
  });
  test('always is resizeMode subproperty', () => {
    expect(formattedSchema[1].subproperties[0].subproperties[0].name).toBe('always');
  });
  test('backgroundColor is splash subproperty', () => {
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
