const { createServer } = require('node:http');
const path = require('node:path');
const { createRequestHandler } = require(process.argv[2]);

const handler = createRequestHandler({ build: path.join(__dirname, 'dist/server') });
createServer((request, response) => {
  handler(request, response, (error) => {
    response.statusCode = error ? 500 : 404;
    response.end(String(error ?? 'Not found'));
  });
}).listen(Number(process.env.PORT), '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${process.env.PORT}`);
});
