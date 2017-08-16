import React from 'react';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import get from 'lodash/get';

import { rhythm } from '../utils/typography';
import { getVersionFromUrl } from '../utils/url';

function initializeEmbeds() {
  if (window.ExpoSnack) {
    window.ExpoSnack.initialize();
  } else {
    let scriptEl = document.createElement('script');
    scriptEl.async = true;
    scriptEl.type = 'text/javascript';
    scriptEl.src = `https://snack.expo.io/embed.js`;
    document.body.appendChild(scriptEl);
  }
}

class DocsPage extends React.Component {
  componentDidMount() {
    initializeEmbeds();
  }

  componentDidUpdate() {
    initializeEmbeds();
  }

  render() {
    const post = this.props.data.markdownRemark;

    var link = [];

    try {
      var slugArr = post.fields.fileSlug.split('/');
      slugArr[2] = 'latest';
      const canonicalUrl = 'https://docs.expo.io' + slugArr.join('/') + '.html';
      link.push({ rel: 'canonical', href: canonicalUrl });
    } catch (e) {
      // It's okay - just don't set a canonical URL
    }

    return (
      <div>
        <Helmet
          title={post.frontmatter.title}
          meta={[
            {
              name: `description`,
              content: post.excerpt,
            },
            // Tell spiders to not index unversioned
            getVersionFromUrl(post.fields.fileSlug) === 'unversioned'
              ? { name: 'robots', content: 'noindex' }
              : {},
          ]}
          link={link}
        />
        <h1>{post.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <hr />
        <div
          css={{
            textAlign: `center`,
            marginBottom: rhythm(1 / 2),
          }}>
          Still have questions?
          {' '}<a href="https://forums.expo.io/">Ask on our forums!</a>
          <div>
            <a
              css={{
                fontSize: '12px',
              }}
              href={
                'https://github.com/expo/expo-docs/blob/master' +
                post.fields.fileSlug +
                (post.fields.isIndex ? '/index' : '') +
                '.md'
              }>
              You can edit the content above on GitHub and send us a pull
              request!
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default DocsPage;

export const pageQuery = graphql`
  query TemplatePage ($fileSlug: String!) {
    markdownRemark(fields: { fileSlug: {eq: $fileSlug} }) {
      html
      excerpt
      frontmatter {
        title
      }
      fields {
        fileSlug
        isIndex
      }
    }
  }
`;
