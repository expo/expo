import React from 'react';

import Permalink from '~/components/base/permalink';
import { H2, H3, H4 } from '~/components/base/headers';
import { PDIV, P, Quote } from '~/components/base/paragraph';
import { UL, OL, LI } from '~/components/base/list';
import { InlineCode } from '~/components/base/code';
import { ExternalLink } from '~/components/base/link';
import DocsPage from '~/components/pages/docs';

export default function withDoc(options) {
  return function withContent(content) {
    class DocPage extends React.Component {
      static async getInitialProps(context) {
        return { asPath: context.asPath };
      }

      render() {
        return (
          <DocsPage title={options.title} url={this.props.url} asPath={this.props.asPath}>
            {content}
          </DocsPage>
        );
      }
    }

    return DocPage;
  };
}

const createPermalinkedComponent = BaseComponent => {
  let newComp = ({ children }) => (
    <Permalink>
      <BaseComponent>{children}</BaseComponent>
    </Permalink>
  );
  return newComp;
};

export const components = {
  p: PDIV,
  strong: P.B,
  ul: UL,
  ol: OL,
  li: LI,
  h2: createPermalinkedComponent(H2),
  h3: createPermalinkedComponent(H3),
  h4: createPermalinkedComponent(H4),
  code: InlineCode,
  a: ExternalLink,
  blockquote: Quote,
};
