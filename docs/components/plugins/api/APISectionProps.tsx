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

const renderProp = (data: any): JSX.Element => {
  const props = data.type.types.filter((e: any) => e.declaration);
  return (
    <div key={`props-definition-${data.name}`}>
      <UL>
        {props?.map((def: any) =>
          def.declaration?.children.map((prop: any) => (
            <LI>
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
            </LI>
          ))
        )}
      </UL>
    </div>
  );
};

const APISectionProps: React.FC<APISubSectionProps> = ({ data }) =>
  data && data.length ? (
    <>
      <H2 key="props-header">Props</H2>
      {data.map(renderProp)}
    </>
  ) : null;

export default APISectionProps;
