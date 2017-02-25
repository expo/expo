const remark = require('remark');
const remarkParser = remark();
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const reduce = require('lodash/reduce');

const fs = require('fs-extra');
const visit = require('unist-util-visit');
const select = require('unist-util-select');

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
      let url = node.url;

      if (url && url.match(/\/versions\/latest\//)) {
        let version = path.match(/v\d.*?\//)[0].replace('/', '');
        let newUrl = url.replace('/versions/latest', `/versions/${version}`);
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
