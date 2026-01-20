import { createTempProject, cleanUpProject, prebuildProject } from '../utils/project';

let TEMP_DIR: string;

/**
 * Validates the plugin behavior for iOS
 */
describe('plugin for ios', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('pluginios');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('pluginios');
  }, 600000);

  it('should infer default values', async () => {
    await prebuildProject(TEMP_DIR, 'ios');
  });

  it('should correctly use bundle identifier from plugin props', async () => {
    await prebuildProject(TEMP_DIR, 'ios');
  });

  it('should correctly use target name from plugin props', async () => {
    await prebuildProject(TEMP_DIR, 'ios');
  });
});
