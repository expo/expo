const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const select = require(`unist-util-select`);
const parseFilepath = require('parse-filepath');
const fs = require(`fs`);
const slug = require(`slug`);
const sh = require(`shelljs`);
const webpack = require(`webpack`);
const { GraphQLString } = require(`graphql`);

exports.createPages = ({ boundActionCreators, graphql }) => {
  const { upsertPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const pages = [];
    const docsPage = path.resolve(`src/pages/template-documentation-page.js`);
    graphql(
      `
      {
        allMarkdownRemark(limit: 10000) {
          edges {
            node {
              isIndex
              fileSlug
            }
          }
        }
      }
    `
    ).then(result => {
      if (result.errors) {
        console.log(result.errors);
        reject(result.errors);
      }

      // Create docs pages.
      _.each(result.data.allMarkdownRemark.edges, edge => {
        upsertPage({
          path: edge.node.isIndex
            ? edge.node.fileSlug + '/index.html'
            : edge.node.fileSlug + '.html', // required
          component: docsPage,
          context: {
            fileSlug: edge.node.fileSlug,
          },
        });
      });

      // We're done.
      resolve();
    });
  });
};

// Add custom slug.
exports.onNodeCreate = ({ node, boundActionCreators, getNode }) => {
  const { updateNode } = boundActionCreators;
  if (node.type === 'MarkdownRemark') {
    const file = getNode(node.parent);
    const parsedFilePath = parseFilepath(file.relativePath);
    let fileSlug;
    if (parsedFilePath.name !== `index`) {
      fileSlug = `/versions/${parsedFilePath.dirname}/${parsedFilePath.name}`;
    } else {
      fileSlug = `/versions/${parsedFilePath.dirname}`;
      file.isIndex = true;
      node.isIndex = true;
    }

    node.fileSlug = fileSlug;
    file.fileSlug = fileSlug;

    updateNode(node);
    updateNode(file);
  }
};
