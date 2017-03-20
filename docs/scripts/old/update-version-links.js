const remark = require('remark');
const remarkParser = remark();
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const reduce = require('lodash/reduce');

const fs = require('fs-extra');
const visit = require('unist-util-visit');
const select = require('unist-util-select');

const NewVersion = 14;
const PrevVersion = 13;

function findMarkdownFiles() {
  const glob = require('glob');
  const files = glob.sync(`../versions/v${NewVersion}.0.0/**/*.md`, {});
  return files;
}

function updateAllLinks(filePaths) {
  filePaths.map(path => {
    const md = fs.readFileSync(path, 'utf-8');
    const ast = remarkParser.parse(md);
    visit(ast, 'link', node => {
      let url = node.url;

      if (url.includes(`${PrevVersion}.0.0`)) {
        let newUrl = url.replace(`${PrevVersion}.0.0`, `${NewVersion}.0.0`);
        console.log(`Changing ${url} to ${newUrl}`);
        node.url = newUrl;
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
