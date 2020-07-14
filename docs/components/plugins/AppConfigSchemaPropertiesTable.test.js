import { render } from '@testing-library/react';
import AppConfigSchemaPropertiesTable, {
  formatSchema,
  createDescription,
} from './AppConfigSchemaPropertiesTable';
import { SluggerContext } from '~/components/page-higher-order/withSlugger';
import GithubSlugger from 'github-slugger';

var testSchema = {
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
    meta: {
      bareWorkflow: 'This is set in AndroidManifest.xml directly.',
    },
  },
};

describe('AppConfigSchemaPropertiesTable', () => {
  test('correctly matches snapshot', () => {
    const { container } = render(
      <SluggerContext.Provider value={new GithubSlugger()}>
        <AppConfigSchemaPropertiesTable schema={testSchema} />
      </SluggerContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('formatSchema', () => {
  const formattedSchema = formatSchema(Object.entries(testSchema));
  test('name is property level 0', () => {
    expect(formattedSchema[0].level).toBe(0);
  });
  test('androidNavigationBar is property level 0', () => {
    expect(formattedSchema[1].level).toBe(0);
  });
  test('visible is subproperty level 1', () => {
    expect(formattedSchema[2].level).toBe(1);
  });
  test('visible has type "enum"', () => {
    expect(formattedSchema[2].type).toBe('enum');
  });
  test('always is subproperty level 2', () => {
    expect(formattedSchema[3].level).toBe(2);
  });
  test('backgroundColor is subproperty level 1', () => {
    expect(formattedSchema[4].level).toBe(1);
  });
  test('intentFilters is property level 0', () => {
    expect(formattedSchema[5].level).toBe(0);
  });
  test('autoVerify is subproperty level 1', () => {
    expect(formattedSchema[6].level).toBe(1);
  });
  test('data is subproperty level 1', () => {
    expect(formattedSchema[7].level).toBe(1);
  });
  test('host is subproperty level 2', () => {
    expect(formattedSchema[8].level).toBe(2);
  });
});

describe('createDescription', () => {
  test('exampleString, bareWorkflow are both added correctly to intentFilters', () => {
    const intentFiltersObject = Object.entries(testSchema)[2];
    const intentFiltersObjectValue = intentFiltersObject[1];
    const result = createDescription(intentFiltersObject);

    expect(result).toBe(
      `${intentFiltersObjectValue.description}\n\n>${intentFiltersObjectValue.exampleString}\n\n>**Bare workflow**: ${intentFiltersObjectValue.meta.bareWorkflow}`
    );
  });

  test('regexHuman is added correctly to backgroundColor', () => {
    //Note: to access this subproperty is tedious without a call to formatSchema
    const backgroundColorObject = Object.entries(Object.values(testSchema)[1].properties)[1];
    const backgroundColorObjectValue = backgroundColorObject[1];
    const result = createDescription(backgroundColorObject);

    expect(result).toBe(
      `${backgroundColorObjectValue.description}\n\n${backgroundColorObjectValue.meta.regexHuman}`
    );
  });

  test('expoKit is added correctly to visible', () => {
    //Note: to access this subproperty is tedious without a call to formatSchema
    const visibleObject = Object.entries(Object.values(testSchema)[1].properties)[0];
    const visibleObjectValue = visibleObject[1];
    const result = createDescription(visibleObject);

    expect(result).toBe(
      `${visibleObjectValue.description}\n>**ExpoKit**: ${visibleObjectValue.meta.expoKit}`
    );
  });

  test('bareWorkflow is added correctly to name', () => {
    const nameObject = Object.entries(testSchema)[0];
    const nameObjectValue = nameObject[1];
    const result = createDescription(nameObject);

    expect(result).toBe(
      `${nameObjectValue.description}\n>**Bare workflow**: ${nameObjectValue.meta.bareWorkflow}`
    );
  });

  test('expoKit, bareWorkflow both added correctly to androidNavigationBar', () => {
    const androidNavigationBarObject = Object.entries(testSchema)[1];
    const androidNavigationBarObjectValue = androidNavigationBarObject[1];
    const result = createDescription(androidNavigationBarObject);

    expect(result).toBe(
      `${androidNavigationBarObjectValue.description}\n>**ExpoKit**: ${androidNavigationBarObjectValue.meta.expoKit}\n\n>**Bare workflow**: ${androidNavigationBarObjectValue.meta.bareWorkflow}`
    );
  });
});
