// const getDevServer = require('./getDevServer');
import { StackFrame } from 'react-native/Libraries/Core/Devtools/parseErrorStack';

function getDevServer(): any {
  return {};
}

const SourceCode = { scriptURL: null }; //require('../../BatchedBridge/NativeModules');

// Avoid requiring fetch on load of this module; see symbolicateStackTrace
let fetch;

function isSourcedFromDisk(sourcePath: string): boolean {
  return !/^http/.test(sourcePath) && /[\\/]/.test(sourcePath);
}

async function symbolicateStackTrace(stack: Array<StackFrame>): Promise<Array<StackFrame>> {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error('Bundle was not loaded from the packager');
  }

  let stackCopy: any = stack;

  if (SourceCode.scriptURL) {
    let foundInternalSource: boolean = false;
    stackCopy = stack.map((frame: StackFrame) => {
      // If the sources exist on disk rather than appearing to come from the packager,
      // replace the location with the packager URL until we reach an internal source
      // which does not have a path (no slashes), indicating a switch from within
      // the application to a surrounding debugging environment.
      if (!foundInternalSource && isSourcedFromDisk(frame.file)) {
        // Copy frame into new object and replace 'file' property
        return { ...frame, file: SourceCode.scriptURL };
      }

      foundInternalSource = true;
      return frame;
    });
  }

  const response = await fetch(devServer.url + 'symbolicate', {
    method: 'POST',
    body: JSON.stringify({ stack: stackCopy }),
  });
  const json = await response.json();
  return json.stack;
}

export default symbolicateStackTrace;
