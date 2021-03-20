import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { B } from '~/components/base/paragraph';
import { H2 } from '~/components/plugins/Headings';
import {
  APISubSectionProps,
  renderers,
  resolveTypeName,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionPropsDefaults = {
  defaultProps?: any;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = (defaultProps: any, propName: string) => {
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: any) => defaultProp.name === propName
  )[0].defaultValue;
};

const renderProps = (data: any, defaultValues: any): JSX.Element => {
  const props = data.type.types.filter((e: any) => e.declaration);
  return (
    <div key={`props-definition-${data.name}`}>
      <UL>
        {props?.map((def: any) =>
          def.declaration?.children.map((prop: any) =>
            renderProp(prop, extractDefaultPropValue(defaultValues, prop.name))
          )
        )}
      </UL>
    </div>
  );
};

const renderProp = (prop: any, defaultValue: any) => (
  <LI key={`prop-entry-${prop.name}`}>
    <B>
      {prop.name} (<InlineCode>{resolveTypeName(prop.type)}</InlineCode>)
    </B>
    {prop.comment ? (
      <span>
        {' - '}
        <ReactMarkdown
          renderers={{
            ...renderers,
            ...{
              paragraph: ({ children }) => (children ? <span>{children}</span> : null),
            },
          }}>
          {prop.comment.shortText}
        </ReactMarkdown>
      </span>
    ) : null}
    {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
      <span>
        {' Default: '}
        <InlineCode>{defaultValue}</InlineCode>
      </span>
    ) : null}
  </LI>
);

const APISectionProps: React.FC<APISubSectionProps & APISectionPropsDefaults> = ({
  data,
  defaultProps,
}) =>
  data && data.length ? (
    <>
      <H2 key="props-header">Props</H2>
      {data.map((prop: any) => renderProps(prop, defaultProps))}
    </>
  ) : null;

export default APISectionProps;
