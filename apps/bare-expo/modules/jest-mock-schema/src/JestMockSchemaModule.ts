import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class JestMockSchemaModule extends NativeModule {
  getModulesSchema(): string;
}

export default requireOptionalNativeModule<JestMockSchemaModule>('JestMockSchemaModule');
