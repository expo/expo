import { StackFrame } from 'react-native/Libraries/Core/Devtools/parseErrorStack';

async function symbolicateStackTrace(): Promise<Array<StackFrame> | null> {
  return null;
}

export default symbolicateStackTrace;
