var osmosis = require('osmosis');
var sanitizeHtml = require('sanitize-html');
const fs = require('fs-extra');
const sh = require(`shelljs`);
const remark = require(`remark`);
const remarkParser = remark();
const visit = require(`unist-util-visit`);
const _ = require(`lodash`);
const jsYaml = require(`js-yaml`);
const path = require(`path`);
const parsePath = require(`parse-filepath`);
const isRelative = require(`is-relative`);
const select = require(`unist-util-select`);
const async = require(`async`);
const remove = require(`unist-util-remove`);
const url = require(`url`);
const http = require(`https`);

const download = function(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  const request = http.get(url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  });
};

// Create queue for processing pages.
const processPage = (document, callback) => {
  console.time(`process page`);
  //if (_.includes(document.old_permalink, `index.html`)) {
  console.log(`old permalink`, document.old_permalink);
  //}
  document.title = document.title.slice(0, -1);
  if (document.previous___FILE) {
    document.previous___FILE = `./${document.previous___FILE.replace('.html', '.md')}`;
  }
  if (document.next___FILE) {
    document.next___FILE = `./${document.next___FILE.replace('.html', '.md')}`;
  }
  fs.writeFileSync(`./2test.html`, document.document, `utf-8`);
  sh.exec(
    `echo "${document.document}" | pandoc --atx-headers --parse-raw -f html -t markdown_github-raw_html-native_divs-native_spans`
  );
  process.exit();
  let md = fs.readFileSync(`./test.md`, `utf-8`);
  const ast = remarkParser.parse(md);

  // Setup directory for blog post.
  const parsedPath = parsePath(document.old_permalink);
  const markdownPath = `${process.cwd()}/scrapped${parsedPath.dirname}/${parsedPath.name}.md`;
  const newDir = `${process.cwd()}/scrapped${parsedPath.dirname}`;
  fs.ensureDirSync(newDir);

  // Remove all (other) pointer links created by Sphinx
  const toRemove = [];
  visit(ast, `link`, node => {
    if (
      node.title === `Permalink to this headline` ||
      node.title === 'Permalink to this definition'
    ) {
      toRemove.push(node);
    } else {
      if (_.includes(node.title, `Permalink`)) {
        console.log(node);
      }
    }
  });
  // One link (for whatever reason) pandoc is converting to an
  // image
  visit(ast, `image`, node => {
    if (
      node.title === `Permalink to this headline` ||
      node.title === 'Permalink to this definition'
    ) {
      toRemove.push(node);
    } else {
      if (_.includes(node.title, `Permalink`)) {
        console.log(node);
      }
    }
  });

  remove(ast, toRemove);

  // One link (for whatever reason) pandoc is converting to an
  // image
  visit(ast, `image`, node => {
    if (
      node.title === `Permalink to this headline` ||
      node.title === 'Permalink to this definition'
    ) {
      toRemove.push(node);
    } else {
      if (_.includes(node.title, `Permalink`)) {
        console.log(node);
      }
    }
  });

  // Remove the first h1 (we'll set that from the title in the frontmatter)
  const firstChild = ast.children[0];
  if (firstChild.type === 'heading' && firstChild.depth === 1) {
    ast.children.shift();
  }

  // Set code block languages to Javascript
  visit(ast, `code`, node => {
    //node.position.start.column = 1
    //node.position.indent = node.position.indent.map((indent) => 0)
    node.value.replace(/\t/g, `  `);
    delete node.position;
    node.lang = `javascript`;
  });

  // Make images absolute
  visit(ast, `image`, node => {
    if (isRelative(node.url)) {
      node.url = url.resolve(parsedURL.dirname, node.url);
    }
  });

  // Make links absolute
  visit(ast, `link`, node => {
    if (isRelative(node.url)) {
      node.url = url.resolve(parsedURL.dirname, node.url);
    }

    // If the link has a child node that's an image, replace it with the child
    // image.
    //if (node.children && node.children[0].type === `image`) {
    //if (document.old_permalink === `/versions/v12.0.0/guides/development-mode.html`) {
    //console.log(`has image child`, node.children)
    //}
    //node = node.children[0]
    ////console.log(node)
    //}
  });
  //links.forEach((link) => {
  //}
  //console.log(ast)
  console.log(select(ast, `link`));
  const replaceNode = (node, parent) => {
    // Recurse deeper
    if (node.type === `list` || node.type === `paragraph`) {
      node.children.forEach(childNode => replaceNode(childNode, node));
    }

    // Replace
    if (node.type === `link` && node.children[0] && node.children[0].type === `image`) {
      //console.log(`replacing this node`, node)
      //node = node.children[0]
      //delete node.position
      //console.log(`new node`, node)
      // Filter out link node from its parents children and push the image
      parent.children = _.filter(parent.children, child => child !== node);
      parent.children.push(node.children[0]);
    }
  };
  ast.children.forEach(node => {
    replaceNode(node, ast);
  });

  if (document.old_permalink === `/versions/v12.0.0/guides/development-mode.html`) {
    const links = select(ast, `link`);
    const images = select(ast, `image`);
    console.log(JSON.stringify(links, null, 4));
    console.log(images);
  }

  // Download images (any that haven't been downloaded already) and change
  // the image url to point the local copies.
  const imagesToDownload = [];
  let mainImage;
  visit(ast, `image`, node => {
    const parsedPath = parsePath(node.url);
    const newPath = path.join(newDir, parsedPath.basename);
    const relativePath = `./${parsedPath.basename}`;
    if (!mainImage) {
      mainImage = relativePath;
    }
    imagesToDownload.push({
      url: node.url,
      newPath,
      relativePath,
    });
    // Change node path
    node.url = relativePath;
  });
  // Download images for the page.
  Promise.all(
    imagesToDownload.map(image => {
      return new Promise((resolve, reject) => {
        // Check if the file exists.
        if (fs.existsSync(image.newPath)) {
          resolve();
        } else {
          download(image.url, image.newPath, () => {
            console.log(`finished downloading image from ${image.url}`);
            resolve();
          });
        }
      });
    })
  );

  // Add frontmatter
  const frontmatter = _.pick(document, [
    `title`,
    `old_permalink`,
    `previous___FILE`,
    `next___FILE`,
  ]);
  ast.children.unshift({
    type: 'yaml',
    value: jsYaml.safeDump(frontmatter),
  });

  console.log(`writing to`, markdownPath);
  fs.writeFileSync(markdownPath, remarkParser.stringify(ast), `utf-8`);
  //console.timeEnd(`process page`)
  callback();
};
const q = async.queue(processPage, 10);

const version = `https://docs.getexponent.com/versions/v12.0.0/guides/logging.html`;
const onePage = `https://docs.getexponent.com/versions/v14.0.0/sdk/keep-awake.html`;
//const version = `https://docs.getexponent.com/versions/v11.0.0/guides/logging.html`
//const version = `https://docs.getexponent.com/versions/v10.0.0/guides/logging.html`
//const version = `https://docs.getexponent.com/versions/v9.0.0/guides/logging.html`
//const version = `https://docs.getexponent.com/versions/v8.0.0/guides/logging.html`
//const version = `https://docs.getexponent.com/versions/v7.0.0/guides/logging.html`
//const version = `https://docs.getexponent.com/versions/v6.0.0/guides/logging.html`
const parsedURL = parsePath(version);
osmosis
  //.get('https://docs.getexponent.com/versions/v12.0.0/guides/development-mode.html')
  //.get(version)
  //.find('#left-column a')
  //.follow('@href')
  .get(onePage)
  .set('old_permalink', location => {
    return location.request.path;
  })
  .find('.document')
  .set('document', div => div.innerHTML)
  .find('h1')
  .set('title')
  .find('.footer-relations')
  .set({
    previous___FILE: '.pull-left a@href',
    next___FILE: '.pull-right a@href',
  })
  .data(document => {
    q.push(document);
  });
//.log(console.log)
//.error(console.log)
//.debug(console.log)
