import { css } from '@emotion/react';
import { borderRadius, breakpoints, spacing, theme, typography } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '../base/code';

import { createPermalinkedComponent } from '~/common/create-permalinked-component';
import { HeadingType } from '~/common/headingManager';
import { PDIV } from '~/components/base/paragraph';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents, mdInlineComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import { CALLOUT } from '~/ui/components/Text';

type PropertyMeta = {
  regexHuman?: string;
  deprecated?: boolean;
  hidden?: boolean;
  expoKit?: string;
  bareWorkflow?: string;
};

export type Property = {
  description?: string;
  type?: string | string[];
  meta?: PropertyMeta;
  pattern?: string;
  enum?: string[];
  example?: any;
  exampleString?: string;
  host?: object;
  properties?: Record<string, Property>;
  items?: {
    properties?: Record<string, Property>;
    [key: string]: any;
  };
  uniqueItems?: boolean;
  additionalProperties?: boolean;
};

type FormattedProperty = {
  name: string;
  description: string;
  type?: string;
  example?: string;
  expoKit?: string;
  bareWorkflow?: string;
  subproperties: FormattedProperty[];
  parent?: string;
};

type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

const Anchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.InlineCode,
});

const PropertyName = ({ name, nestingLevel }: { name: string; nestingLevel: number }) => (
  <Anchor level={nestingLevel} data-testid={name}>
    <InlineCode css={typography.fontSizes[16]}>{name}</InlineCode>
  </Anchor>
);

export function formatSchema(rawSchema: [string, Property][]) {
  const formattedSchema: FormattedProperty[] = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property);
  });

  return formattedSchema;
}

function appendProperty(formattedSchema: FormattedProperty[], property: [string, Property]) {
  const propertyValue = property[1];

  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  formattedSchema.push(formatProperty(property));
}

function formatProperty(property: [string, Property], parent?: string): FormattedProperty {
  const propertyKey = property[0];
  const propertyValue = property[1];

  const subproperties: FormattedProperty[] = [];

  if (propertyValue.properties) {
    Object.entries(propertyValue.properties).forEach(subproperty => {
      subproperties.push(
        formatProperty(subproperty, parent ? `${parent}.${propertyKey}` : propertyKey)
      );
    });
  } // note: sub-properties are sometimes nested within "items"
  else if (propertyValue.items && propertyValue.items.properties) {
    Object.entries(propertyValue.items.properties).forEach(subproperty => {
      subproperties.push(
        formatProperty(subproperty, parent ? `${parent}.${propertyKey}` : propertyKey)
      );
    });
  }

  return {
    name: propertyKey,
    description: createDescription(property),
    type: _getType(propertyValue),
    example: propertyValue.exampleString?.replaceAll('\n', ''),
    expoKit: propertyValue?.meta?.expoKit,
    bareWorkflow: propertyValue?.meta?.bareWorkflow,
    subproperties,
    parent,
  };
}

export function _getType({ enum: enm, type }: Partial<Property>) {
  return enm ? 'enum' : type?.toString().replace(',', ' || ');
}

export function createDescription(propertyEntry: [string, Property]) {
  const propertyValue = propertyEntry[1];

  let propertyDescription = ``;
  if (propertyValue.description) {
    propertyDescription += propertyValue.description;
  }
  if (propertyValue.meta && propertyValue.meta.regexHuman) {
    propertyDescription += `\n\n` + propertyValue.meta.regexHuman;
  }

  return propertyDescription;
}

const AppConfigSchemaPropertiesTable = ({ schema }: AppConfigSchemaProps) => {
  const rawSchema = Object.entries(schema);
  const formattedSchema = formatSchema(rawSchema);

  return (
    <div>
      {formattedSchema.map((formattedProperty, index) => (
        <AppConfigProperty {...formattedProperty} index={index} nestingLevel={0} />
      ))}
    </div>
  );
};

const AppConfigProperty = ({
  name,
  description,
  example,
  expoKit,
  bareWorkflow,
  type,
  nestingLevel,
  subproperties,
  parent,
  index,
}: FormattedProperty & { index: number; nestingLevel: number }) => (
  <APIBox key={`${name}-${index}`} css={[boxStyle, nestedBoxStyle]}>
    <PropertyName name={name} nestingLevel={nestingLevel} />
    <CALLOUT theme="secondary">
      Type: <InlineCode>{type || 'undefined'}</InlineCode>
      {nestingLevel > 0 && (
        <>
          &emsp;&bull;&emsp;Path:{' '}
          <InlineCode css={secondaryCodeLineStyle}>
            {parent}.{name}
          </InlineCode>
        </>
      )}
    </CALLOUT>
    <br />
    <ReactMarkdown components={mdComponents}>{description}</ReactMarkdown>
    {expoKit && (
      <Collapsible summary="ExpoKit">
        <ReactMarkdown components={mdComponents}>{expoKit}</ReactMarkdown>
      </Collapsible>
    )}
    {bareWorkflow && (
      <Collapsible summary="Bare Workflow">
        <ReactMarkdown components={mdComponents}>{bareWorkflow}</ReactMarkdown>
      </Collapsible>
    )}
    {example && <ReactMarkdown components={mdInlineComponents}>{`> ${example}`}</ReactMarkdown>}
    <div>
      {subproperties.length > 0 &&
        subproperties.map((formattedProperty, index) => (
          <AppConfigProperty {...formattedProperty} index={index} nestingLevel={nestingLevel + 1} />
        ))}
    </div>
  </APIBox>
);

const boxStyle = css({
  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    paddingTop: spacing[4],
  },
});

const nestedBoxStyle = css({
  boxShadow: 'none',
  marginBottom: 0,
  borderRadius: 0,
  borderBottomWidth: 0,

  '&:first-of-type': {
    borderTopLeftRadius: borderRadius.medium,
    borderTopRightRadius: borderRadius.medium,
  },

  '&:last-of-type': {
    borderBottomLeftRadius: borderRadius.medium,
    borderBottomRightRadius: borderRadius.medium,
    marginBottom: spacing[4],
    borderBottomWidth: 1,
  },
});

const secondaryCodeLineStyle = css({
  color: theme.text.secondary,
  background: 'none',
});

export default AppConfigSchemaPropertiesTable;
