import React from 'react';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import get from 'lodash/get';

class DocsPage extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    return (
      <div>
        <Helmet
          title={post.frontmatter.title}
          meta={[
            {
              name: `description`,
              content: post.excerpt
            }
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
