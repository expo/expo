const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const select = require(`unist-util-select`);
const parseFilepath = require('parse-filepath');
const fs = require(`fs`);
const slug = require(`slug`);
const sh = require(`shelljs`);
const webpack = require(`webpack`);
const {
  GraphQLString,
} = require(`graphql`);

exports.createPages = ({ args }) => {
  const { graphql } = args;

  return new Promise((resolve, reject) => {
    const pages = [];
    const docsPage = path.resolve(`pages/template-documentation-page.js`);
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
        pages.push({
          path: edge.node.isIndex
            ? edge.node.fileSlug + '/index.html'
            : edge.node.fileSlug + '.html', // required
          component: docsPage,
          context: {
            fileSlug: edge.node.fileSlug,
          },
        });
      });

      console.log(`num pages`, pages.length);
      console.log(pages.slice(0, 2));
      console.log(pages.filter(page => !page.path));
      resolve(pages);
    });
  });
};

// Add custom slug.
exports.modifyAST = ({ args }) => {
  console.time(`local modifyAST`);
  const { ast } = args;
  const files = select(ast, `File[extension="md"]`);
  files.forEach(file => {
    const parsedFilePath = parseFilepath(file.relativePath);
    let fileSlug;
    if (parsedFilePath.name !== `index`) {
      fileSlug = `/versions/${parsedFilePath.dirname}/${parsedFilePath.name}`;
    } else {
      fileSlug = `/versions/${parsedFilePath.dirname}`;
      file.isIndex = true;
      file.children[0].isIndex = true;
    }

    file.children[0].fileSlug = fileSlug;

    file.fileSlug = fileSlug;
  });
  console.timeEnd(`local modifyAST`);
  return files;
};
