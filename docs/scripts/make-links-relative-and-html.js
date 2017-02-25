const remark = require('remark');
const remarkParser = remark();
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const reduce = require('lodash/reduce');

const fs = require('fs-extra');
const visit = require('unist-util-visit');
const select = require('unist-util-select');

const Version = 14;

function findMarkdownFiles() {
  const glob = require('glob');
  const files = glob.sync(`../versions/v${Version}.0.0/**/*.md`, {});
  return files;
}

function findSection(fullPath) {
  let base = `/v${Version}.0.0`;
  if (fullPath.includes(`${base}/introduction`)) {
    return 'introduction';
  } else if (fullPath.includes(`${base}/sdk`)) {
    return 'sdk';
  } else if (fullPath.includes(`${base}/guides`)) {
    return 'guides';
  }
}

function findItem(fullPath, versionPath) {
  if (fullPath === versionPath) {
    return 'index';
  }
  let parts = fullPath.split('/');
  let item = parts[parts.length - 1];
  if (item.includes('.html')) {
    // do nothing
  } else if (item.includes('#')) {
    item = item.split('#').join('.html#');
  } else {
    item = `${item}.html`;
  }

  return item;
}

function updateAllLinks(filePaths) {
  const versionPath = `/versions/v${Version}.0.0/`;

  filePaths.map(path => {
    const md = fs.readFileSync(path, 'utf-8');
    const ast = remarkParser.parse(md);
    const currentSection = findSection(path);
    visit(ast, 'link', node => {
      let url = node.url;

      if (url.includes(versionPath)) {
        const targetSection = findSection(url);
        const targetItem = findItem(url, versionPath);

        let newUrl;
        if (currentSection === targetSection) {
          // same dir, just 'audio.html' or w/e
          newUrl = targetItem;
        } else if (!currentSection) {
          // current section is root, target section is not, so sdk/audio.html for example
          newUrl = `${targetSection}/${targetItem}`;
        } else if (!targetSection) {
          // current section is not root, target is, so ../
          newUrl = `../${targetItem}`;
        } else if (currentSection !== targetSection) {
          // current section is not target, but both are sections, so ../sdk/audio.html for example
          newUrl = `../${targetSection}/${targetItem}`;
        }

        console.log({ newUrl, url, currentSection });
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
