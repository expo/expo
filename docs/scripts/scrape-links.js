const remark = require('remark');
const remarkParser = remark();
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');

const fs = require('fs-extra');
const visit = require('unist-util-visit');
const select = require('unist-util-select');

function findMarkdownFiles() {
  const glob = require('glob');
  const files = glob.sync('../versions/**/*.md', {});
  return files;
}

function findAllLinks(filePaths) {
  let links = filePaths.map(path => {
    const md = fs.readFileSync(path, `utf-8`);
    const ast = remarkParser.parse(md);
    let nodes = select(ast, `link`);
    return nodes.map(node => node.url);
  });

  links = uniq(flatten(links));
  links = links.filter(link => link.match(/docs.getexponent.com/));
  links = links.map(link => link.replace('https://docs.expo.io', ''));
  links.sort();
  links = links.map(link => ({ current: link, actual: link }));
  return links;
}

const files = findMarkdownFiles();
const links = findAllLinks(files);

fs.writeJson('./links.json', links);
console.log('done');
