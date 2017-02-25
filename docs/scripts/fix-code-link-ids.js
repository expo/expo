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

      if (url && url.match(/#/)) {
        let parts = url.split('#');
        let hash = parts[parts.length - 1];
        if (hash.match(/Exponent\./)) {
          let newHash = hash.toLowerCase().replace(/\./g, '');
          let newUrl = url.replace(hash, newHash);
          console.log(`Changing ${node.url} to ${newUrl}`);
          node.url = newUrl;
        }
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
