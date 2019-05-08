export class WebWorker extends Worker {
  constructor(worker) {
    const code = worker.toString();
    const blob = createBlob(['(' + code + ')()'], {
      type: 'application/javascript',
    });
    super(URL.createObjectURL(blob));
  }
}

/**
 * From https://gist.github.com/nolanlawson/10340255
 */
export function createBlob(parts: BlobPart[], properties: BlobPropertyBag | undefined): Blob {
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== 'TypeError') {
      throw e;
    }
    const BlobBuilder =
      window['BlobBuilder'] ||
      window['MSBlobBuilder'] ||
      window['MozBlobBuilder'] ||
      window['WebKitBlobBuilder'];
    const builder = new BlobBuilder();
    for (let i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob((properties || {}).type);
  }
}
