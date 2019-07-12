import React from 'react';

import { DocItem, Section } from '../ui-explorer';
import JSXBlock from '../ui-explorer/JSXBlock';
import Markdown from '../ui-explorer/Markdown';
import notes from './1-Contributing.notes.md';

export const title = 'Contributing';

export const kind = 'Expo|Getting Started';

export const component = () => (
  <Section>
    <Markdown>{notes}</Markdown>
    <DocItem
      name="packageJson"
      typeInfo="Object"
      description="Optional: NPM Package for the related library"
      example={{
        render: () => (
          <JSXBlock>{`export const packageJson = require('expo/package.json');`}</JSXBlock>
        ),
      }}
    />

    <DocItem
      name="component"
      typeInfo="React.Component | Functional Component"
      description="The component that will be rendered inside the page"
      example={{
        render: () => <JSXBlock>{`export const component = () => <View />;`}</JSXBlock>,
      }}
    />
    <DocItem
      name="title"
      typeInfo="string"
      description="The title element and the name of the tab in the side-bar. Defaults to the packageJson name"
      example={{
        render: () => <JSXBlock>{`export const title = 'App Loading';`}</JSXBlock>,
      }}
    />
    <DocItem
      name="description"
      typeInfo="string"
      description="Description that will be rendered under the title element on the page. Defaults to the packageJson description"
      example={{
        render: () => (
          <JSXBlock>
            {`export const description = \`
              A React component that tells Expo
              to keep the app loading screen open
              if it is the first and only component
              rendered in your app\`;`}
          </JSXBlock>
        ),
      }}
    />
    <DocItem
      name="label"
      typeInfo="string"
      description="Github Label for querying related issues on Github"
      example={{
        render: () => <JSXBlock>{`export const label = 'AppLoading';`}</JSXBlock>,
      }}
    />
    <DocItem
      name="kind"
      typeInfo="string"
      description="Side-bar grouping for the page"
      example={{
        render: () => <JSXBlock>{`export const kind = 'AppLoading';`}</JSXBlock>,
      }}
    />
    <DocItem
      name="onStoryCreated"
      typeInfo="({ stories }) => {}"
      description="A callback that is invoked with the stories object which you can use to apply."
      example={{
        render: () => <JSXBlock>{`export const onStoryCreated = ({ stories }) => {}`}</JSXBlock>,
      }}
    />
  </Section>
);
