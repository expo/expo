'use strict';

var Blob = require("../Blob/Blob");
var binaryToBase64 = require("../Utilities/binaryToBase64");
var FormData = require("./FormData");
function convertRequestBody(body) {
  if (typeof body === 'string') {
    return {
      string: body
    };
  }
  if (body instanceof Blob) {
    return {
      blob: body.data
    };
  }
  if (body instanceof FormData) {
    return {
      formData: body.getParts()
    };
  }
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return {
      base64: binaryToBase64(body)
    };
  }
  return body;
}
module.exports = convertRequestBody;
//# sourceMappingURL=convertRequestBody.js.map