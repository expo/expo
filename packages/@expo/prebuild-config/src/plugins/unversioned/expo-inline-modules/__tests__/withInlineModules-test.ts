import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { resolveMainTargetName } from '../withInlineModules';

// Minimal pbxproj with one application target whose name differs from the
// ios/<dir> folder name.
const PBXPROJ = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 77;
	objects = {

/* Begin PBXGroup section */
		F43ABE302F2366380051AD1C = {
			isa = PBXGroup;
			children = (
			);
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXProject section */
		F43ABE312F2366380051AD1C /* Project object */ = {
			isa = PBXProject;
			buildConfigurationList = F43ABE342F2366380051AD1C;
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
			);
			mainGroup = F43ABE302F2366380051AD1C;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				F43ABE372F2366380051AD1C /* Real Target */,
			);
		};
/* End PBXProject section */

/* Begin PBXNativeTarget section */
		F43ABE372F2366380051AD1C /* Real Target */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = F43ABE392F2366380051AD1C;
			buildPhases = (
			);
			buildRules = (
			);
			dependencies = (
			);
			name = "Real Target";
			productName = "Real Target";
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */

/* Begin XCBuildConfiguration section */
		F43ABE352F2366380051AD1C /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
			};
			name = Debug;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		F43ABE342F2366380051AD1C /* Build configuration list */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				F43ABE352F2366380051AD1C /* Debug */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
		F43ABE392F2366380051AD1C /* Build configuration list */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				F43ABE352F2366380051AD1C /* Debug */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
/* End XCConfigurationList section */
	};
	rootObject = F43ABE312F2366380051AD1C /* Project object */;
}
`;

describe(resolveMainTargetName, () => {
  let tempProjectRoot: string;

  beforeEach(async () => {
    tempProjectRoot = await fs.promises.mkdtemp(
      path.resolve(os.tmpdir(), 'with-inline-modules-test-')
    );
  });

  afterEach(async () => {
    await fs.promises.rm(tempProjectRoot, { recursive: true, force: true });
  });

  it('resolves the application target name from the pbxproj, unquoted', async () => {
    const projPath = path.join(tempProjectRoot, 'ios', 'HelloWorld.xcodeproj');
    await fs.promises.mkdir(projPath, { recursive: true });
    await fs.promises.writeFile(path.join(projPath, 'project.pbxproj'), PBXPROJ);

    // The folder-derived name says HelloWorld; the pbxproj target name wins.
    expect(resolveMainTargetName(tempProjectRoot, 'HelloWorld')).toBe('Real Target');
  });

  it('surfaces the parse error for a corrupt pbxproj instead of the fallback', async () => {
    const projPath = path.join(tempProjectRoot, 'ios', 'HelloWorld.xcodeproj');
    await fs.promises.mkdir(projPath, { recursive: true });
    await fs.promises.writeFile(path.join(projPath, 'project.pbxproj'), 'not a pbxproj');

    expect(() => resolveMainTargetName(tempProjectRoot, 'HelloWorld')).toThrow();
  });

  it('falls back to the folder-derived name when there is no ios project', () => {
    expect(resolveMainTargetName(tempProjectRoot, 'HelloWorld')).toBe('HelloWorld');
  });

  it('throws when neither source resolves a name', () => {
    expect(() => resolveMainTargetName(tempProjectRoot, undefined)).toThrow(
      'could not resolve the main Xcode target'
    );
  });
});
