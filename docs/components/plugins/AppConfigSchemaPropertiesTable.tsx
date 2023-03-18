import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { borderRadius, breakpoints, spacing } from '@expo/styleguide-base';
import ReactMarkdown from 'react-markdown';

import { HeadingType } from '~/common/headingManager';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Callout } from '~/ui/components/Callout';
import { Collapsible } from '~/ui/components/Collapsible';
import { P, CALLOUT, CODE, createPermalinkedComponent, BOLD } from '~/ui/components/Text';

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

const Anchor = createPermalinkedComponent(P, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.InlineCode,
});

const PropertyName = ({ name, nestingLevel }: { name: string; nestingLevel: number }) => (
  <Anchor level={nestingLevel} data-testid={name} data-heading="true" css={propertyNameStyle}>
    <CODE css={typography.fontSizes[16]}>{name}</CODE>
  </Anchor>
);

const propertyNameStyle = css({ marginBottom: spacing[4] });

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
  const { description, meta } = propertyEntry[1];

  let propertyDescription = ``;
  if (description) {
    propertyDescription += description;
  }
  if (meta && meta.regexHuman) {
    propertyDescription += `\n\n` + meta.regexHuman;
  }

  return propertyDescription;
}

const AppConfigSchemaPropertiesTable = ({ schema }: AppConfigSchemaProps) => {
  const rawSchema = Object.entries(schema);
  const formattedSchema = formatSchema(rawSchema);

  return (
    <>
      {formattedSchema.map((formattedProperty, index) => (
        <AppConfigProperty
          {...formattedProperty}
          key={`${formattedProperty.name}-${index}`}
          nestingLevel={0}
        />
      ))}
    </>
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
}: FormattedProperty & { nestingLevel: number }) => (
  <APIBox css={boxStyle}>
    <PropertyName name={name} nestingLevel={nestingLevel} />
    <CALLOUT theme="secondary" data-text="true" css={typeRow}>
      Type: <CODE>{type || 'undefined'}</CODE>
      {nestingLevel > 0 && (
        <>
          &emsp;&bull;&emsp;Path:{' '}
          <code css={secondaryCodeLineStyle}>
            {parent}.{name}
          </code>
        </>
      )}
    </CALLOUT>
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
    {example && (
      <Callout>
        <BOLD>Example</BOLD>
        <ReactMarkdown components={mdComponents}>{example}</ReactMarkdown>
      </Callout>
    )}
    <div>
      {subproperties.length > 0 &&
        subproperties.map((formattedProperty, index) => (
          <AppConfigProperty
            {...formattedProperty}
            key={`${name}-${index}`}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </div>
  </APIBox>
);

const boxStyle = css({
  boxShadow: 'none',
  marginBottom: 0,
  borderRadius: 0,
  borderBottomWidth: 0,
  paddingBottom: 0,

  '&:first-of-type': {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },

  '&:last-of-type': {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    marginBottom: spacing[4],
    borderBottomWidth: 1,
  },

  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    paddingTop: spacing[4],
  },
});

const secondaryCodeLineStyle = css({
  color: theme.text.secondary,
  padding: `0 ${spacing[1]}px`,
  wordBreak: 'break-word',
});

const typeRow = css({
  margin: `${spacing[3]}px 0`,
});

export default AppConfigSchemaPropertiesTable;
