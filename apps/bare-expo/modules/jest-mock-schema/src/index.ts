import JestMockSchemaModule from './JestMockSchemaModule';

export const JestMockSchema = {
  getModulesSchema(): string {
    if (!JestMockSchemaModule) {
      throw new Error('JestMockSchemaModule is unavailable. Run inside of bare-expo.');
    }
    return JestMockSchemaModule.getModulesSchema();
  },
  isAvailable() {
    return JestMockSchemaModule != null;
  },
};
