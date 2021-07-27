import crypto from 'crypto';

// TODO - figure out the best way to generate a pure id from filepath
//  needs to be a string with valid JS characters
function generateId(filePath: string) {
  let id = crypto
    .createHash('sha256')
    .update(filePath)
    .digest('base64');

  id = id.replace(/[^a-zA-Z_]/gi, '');

  return id;
}

export { generateId };
