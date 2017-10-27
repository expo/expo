const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const parseFilepath = require('parse-filepath');
const { replaceVersionInUrl, getVersionFromUrl, LATEST_VERSION } = require('./src/utils/url');

exports.createPages = ({ boundActionCreators, graphql }) => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const docsPage = path.resolve(`src/pages/template-documentation-page.js`);

    // NOTE (Abi): Add to query below for faster local debugging
    // Useful for debugging a smaller set of pages:
    // , filter: { fields: { isIndex: { eq: "true" }}}
    // Useful for debugging a page with images:
    // , filter: { fields: { fileSlug: { eq: "/versions/v19.0.0/sdk/map-view" }}}
    // Useful for debugging a smaller set of diverse pages:
    // , filter: { fields: { fileSlug: { regex: "/versions/v19.0.0/sdk/" }}}

    resolve(
      graphql(
        `
          {
            allMarkdownRemark(limit: 10000) {
              edges {
                node {
                  fields {
                    isIndex
                    fileSlug
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          reject(new Error(result.errors));
        }

        // Create docs pages.
        _.each(result.data.allMarkdownRemark.edges, edge => {
          createPage({
            path: edge.node.fields.isIndex
              ? edge.node.fields.fileSlug + '/index.html'
              : edge.node.fields.fileSlug + '.html',
            component: docsPage,
            context: {
              fileSlug: edge.node.fields.fileSlug,
            },
          });
          if (getVersionFromUrl(edge.node.fields.fileSlug) === LATEST_VERSION) {
            createPage({
              path: edge.node.fields.isIndex
                ? replaceVersionInUrl(edge.node.fields.fileSlug, 'latest') + '/index.html'
                : replaceVersionInUrl(edge.node.fields.fileSlug, 'latest') + '.html',
              component: docsPage,
              context: {
                fileSlug: edge.node.fields.fileSlug,
              },
            });
          }
        });

        return;
      })
    );
  });
};

// Add custom slug.
exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators;

  if (node.internal.type === 'MarkdownRemark') {
    const file = getNode(node.parent);
    const parsedFilePath = parseFilepath(file.relativePath);
    let fileSlug;
    if (parsedFilePath.name !== `index`) {
      fileSlug = `/versions/${parsedFilePath.dirname}/${parsedFilePath.name}`;
    } else {
      fileSlug = `/versions/${parsedFilePath.dirname}`;
      createNodeField({ node: file, name: 'isIndex', value: 'true' });
      createNodeField({ node: node, name: 'isIndex', value: 'true' });
    }

    createNodeField({
      node: file,
      name: 'fileSlug',
      value: fileSlug,
    });
    createNodeField({
      node: node,
      name: 'fileSlug',
      value: fileSlug,
    });
  }
};

exports.modifyWebpackConfig = ({ config, stage }) => {
  if (stage === 'build-html') {
    config.loader('null', {
      test: /tippy\.js/,
      loader: 'null-loader',
    });
  }
};
