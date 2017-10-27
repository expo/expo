const remark = require('remark');
const remarkParser = remark();
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const reduce = require('lodash/reduce');

const fs = require('fs-extra');
const visit = require('unist-util-visit');
const select = require('unist-util-select');
const links = require('./links.json');
const linkMap = reduce(
  links,
  (result, link) => {
    result[link.current] = link.actual;
    return result;
  },
  {}
);

function findMarkdownFiles() {
  const glob = require('glob');
  const files = glob.sync('../versions/**/*.md', {});
  return files;
}

function updateAllLinks(filePaths) {
  filePaths.map(path => {
    const md = fs.readFileSync(path, 'utf-8');
    const ast = remarkParser.parse(md);
    visit(ast, 'link', node => {
      let url = node.url.replace('https://docs.getexponent.com', '').replace('.html', '');

      if (linkMap[url]) {
        console.log(`Changing ${url} to ${linkMap[url]}`);
        node.url = linkMap[url];
      }
    });

    fs.writeFileSync(path, remarkParser.stringify(ast), 'utf-8');
    console.log(`Wrote ${path}`);
    console.log(`--------------------------------\n`);
  });
}

const files = findMarkdownFiles();
updateAllLinks(files);

console.log('done');
