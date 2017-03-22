import React from 'react';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import get from 'lodash/get';

function initializeEmbeds() {
  if (window.ExpoSketch) {
    window.ExpoSketch.initialize();
  } else {
    let scriptEl = document.createElement('script');
    scriptEl.async = true;
    scriptEl.type = 'text/javascript';
    scriptEl.src = `https://sketch.expo.io/embed.js`;
    document.body.appendChild(scriptEl);
  }
}

class DocsPage extends React.Component {
  componentDidMount() {
    initializeEmbeds();
  }

  render() {
    const post = this.props.data.markdownRemark;
    return (
      <div>
        <Helmet
          title={post.frontmatter.title}
          meta={[
            {
              name: `description`,
              content: post.excerpt,
            },
          ]}
        />
        <h1>{post.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <hr />
      </div>
    );
  }
}

export default DocsPage;

export const pageQuery = `
  query TemplatePage($fileSlug: String!) {
    markdownRemark(fileSlug: { eq: $fileSlug }) {
      html
      excerpt
      frontmatter {
        title
      }
    }
  }
`;
