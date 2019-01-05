const { parse } = require('url');
const next = require('next');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const port = 3000;
const handle = app.getRequestHandler();

const LATEST_VERSION = 'v' + require('./package.json').version;
const { WORKFLOW, DISTRIBUTION, EXPOKIT } = require('./transition/sections');
const CATEGORY_ALIASES = [
  { path: 'workflow', files: WORKFLOW },
  { path: 'distribution', files: DISTRIBUTION },
  { path: 'expokit', files: EXPOKIT },
];

const mutateCategoryWithRedirectAlias = (category, post) => {
  if (category.toLowerCase() === 'guides') {
    for (let i = 0; i < CATEGORY_ALIASES.length; i++) {
      const alias = CATEGORY_ALIASES[i];
      if (alias.files.indexOf(post) > -1) {
        category = alias.path;
      }
    }
  }

  return category;
};

app.prepare().then(() => {
  const server = express();

  server.use('/static', express.static('static'));
  server.use(
    bodyParser.urlencoded({
      extended: false,
    })
  );
  server.use(
    cors({
      origin: '*',
    })
  );

  if (!dev) {
    server.use(compression());
  }

  // NOTE(jim): Mutations have to line up with FS paths provided by mdjs.
  server.get('/versions/:version/:category/:post', (req, res) => {
    const { query } = parse(req.url, true);
    let { version, category, post } = req.params;

    post = stripTrailingSlashAndExtensions(post);

    if (version === 'latest') {
      version = LATEST_VERSION;
    }

    category = mutateCategoryWithRedirectAlias(category, post);

    const updatedPath = `/versions/${version}/${category}/${post}`;
    req.originalPath = updatedPath;
    app.render(req, res, updatedPath, query);
  });

  server.get('*', (req, res) => {
    const { pathname, query } = parse(req.url, true);
    app.render(req, res, pathname, query);
  });

  server.listen(port, err => {
    if (err) {
      throw err;
    }

    console.log(`The documentation server is running on localhost:${port}`);
  });
});
