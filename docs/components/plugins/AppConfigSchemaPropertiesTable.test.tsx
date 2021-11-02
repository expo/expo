import { render } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import * as React from 'react';

import AppConfigSchemaPropertiesTable, {
  formatSchema,
  createDescription,
  _getType,
  Property,
} from './AppConfigSchemaPropertiesTable';

import { HeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const testSchema: Record<string, Property> = {
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
  test('correctly matches snapshot', () => {
    const { container } = render(
      <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), { headings: [] })}>
        <AppConfigSchemaPropertiesTable schema={testSchema} />
      </HeadingsContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('formatSchema', () => {
  const formattedSchema = formatSchema(Object.entries(testSchema));
  test('name is property nestingLevel 0', () => {
    expect(formattedSchema[0].nestingLevel).toBe(0);
  });
  test('androidNavigationBar is property nestingLevel 0', () => {
    expect(formattedSchema[1].nestingLevel).toBe(0);
  });
  test('visible is subproperty nestingLevel 1', () => {
    expect(formattedSchema[2].nestingLevel).toBe(1);
  });
  test('always is subproperty nestingLevel 2', () => {
    expect(formattedSchema[3].nestingLevel).toBe(2);
  });
  test('backgroundColor is subproperty nestingLevel 1', () => {
    expect(formattedSchema[4].nestingLevel).toBe(1);
  });
  test('intentFilters is property nestingLevel 0', () => {
    expect(formattedSchema[5].nestingLevel).toBe(0);
  });
  test('autoVerify is subproperty nestingLevel 1', () => {
    expect(formattedSchema[6].nestingLevel).toBe(1);
  });
  test('data is subproperty nestingLevel 1', () => {
    expect(formattedSchema[7].nestingLevel).toBe(1);
  });
  test('host is subproperty nestingLevel 2', () => {
    expect(formattedSchema[8].nestingLevel).toBe(2);
  });
});

describe('createDescription', () => {
  test('bareWorkflow, exampleString are both added correctly to intentFilters', () => {
    const intentFiltersObject = Object.entries(testSchema)[2];
    const intentFiltersObjectValue = intentFiltersObject[1] as any;
    const result = createDescription(intentFiltersObject);

    expect(result).toBe(
      `**(${_getType(intentFiltersObjectValue)})** - ${
        intentFiltersObjectValue.description
      }<bareworkflowDetails>${
        intentFiltersObjectValue.meta!.bareWorkflow
      }</bareworkflowDetails>\n\n>${intentFiltersObjectValue.exampleString}`
    );
  });

  test('regexHuman is added correctly to backgroundColor', () => {
    //Note: to access this subproperty is tedious without a call to formatSchema
    const backgroundColorObject = Object.entries(Object.values(testSchema)[1].properties!)[1];
    const backgroundColorObjectValue = backgroundColorObject[1];
    const result = createDescription(backgroundColorObject);

    expect(result).toBe(
      `**(${_getType(backgroundColorObjectValue)})** - ${
        backgroundColorObjectValue.description
      }\n\n${backgroundColorObjectValue.meta!.regexHuman}`
    );
  });

  test('expoKit is added correctly to visible', () => {
    //Note: to access this subproperty is tedious without a call to formatSchema
    const visibleObject = Object.entries(Object.values(testSchema)[1].properties!)[0];
    const visibleObjectValue = visibleObject[1];
    const result = createDescription(visibleObject);

    expect(result).toBe(
      `**(${_getType(visibleObjectValue)})** - ${visibleObjectValue.description}<expokitDetails>${
        visibleObjectValue.meta!.expoKit
      }</expokitDetails>`
    );
  });

  test('bareWorkflow is added correctly to name', () => {
    const nameObject = Object.entries(testSchema)[0];
    const nameObjectValue = nameObject[1];
    const result = createDescription(nameObject);

    expect(result).toBe(
      `**(${_getType(nameObjectValue)})** - ${nameObjectValue.description}<bareworkflowDetails>${
        nameObjectValue.meta!.bareWorkflow
      }</bareworkflowDetails>`
    );
  });

  test('expoKit, bareWorkflow both added correctly to androidNavigationBar', () => {
    const androidNavigationBarObject = Object.entries(testSchema)[1];
    const androidNavigationBarObjectValue = androidNavigationBarObject[1] as any;
    const result = createDescription(androidNavigationBarObject);

    expect(result).toBe(
      `**(${_getType(androidNavigationBarObjectValue)})** - ${
        androidNavigationBarObjectValue.description
      }<expokitDetails>${
        androidNavigationBarObjectValue.meta!.expoKit
      }</expokitDetails><bareworkflowDetails>${
        androidNavigationBarObjectValue.meta!.bareWorkflow
      }</bareworkflowDetails>`
    );
  });
});
