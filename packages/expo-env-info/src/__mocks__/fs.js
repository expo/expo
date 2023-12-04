import { fs, promises } from 'memfs';

const constants = jest.requireActual('fs').constants;

export { fs, promises, constants };
