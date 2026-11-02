import { IOSConfig } from '@expo/config-plugins';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { addPbxGroup } from '../addPbxGroup';

// A project with a widget extension group that already owns an `Info.plist` reference.
const pbxproj = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 54;
	objects = {

/* Begin PBXBuildFile section */
		B00000000000000000000001 /* Widget.swift in Sources */ = {isa = PBXBuildFile; fileRef = F00000000000000000000002 /* Widget.swift */; };
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		F00000000000000000000001 /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
		F00000000000000000000002 /* Widget.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = Widget.swift; sourceTree = "<group>"; };
/* End PBXFileReference section */

/* Begin PBXGroup section */
		G00000000000000000000001 = {
			isa = PBXGroup;
			children = (
				G00000000000000000000002 /* Widget */,
			);
			sourceTree = "<group>";
		};
		G00000000000000000000002 /* Widget */ = {
			isa = PBXGroup;
			children = (
				F00000000000000000000001 /* Info.plist */,
				F00000000000000000000002 /* Widget.swift */,
			);
			path = Widget;
			sourceTree = "<group>";
		};
/* End PBXGroup section */
	};
	rootObject = P00000000000000000000001;
}
`;

function getProject() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sharing-pbx-'));
  const xcodeprojDir = path.join(projectRoot, 'ios', 'App.xcodeproj');
  fs.mkdirSync(xcodeprojDir, { recursive: true });
  fs.writeFileSync(path.join(xcodeprojDir, 'project.pbxproj'), pbxproj);
  return { project: IOSConfig.XcodeUtils.getPbxproj(projectRoot), projectRoot };
}

function groupsReferencing(project: ReturnType<typeof getProject>['project'], fileRef: string) {
  const groups = project.hash.project.objects['PBXGroup'];
  return Object.keys(groups).filter(
    (key) =>
      !key.endsWith('_comment') &&
      groups[key]!.children.some((child: { value: string }) => child.value === fileRef)
  );
}

describe(addPbxGroup, () => {
  it('does not reuse the Info.plist file reference of another group', () => {
    const { project, projectRoot } = getProject();
    try {
      addPbxGroup(
        project,
        'ShareExtension',
        {
          swiftFiles: ['ShareIntoViewController.swift'],
          entitlementFiles: [],
          plistFiles: [],
          assetDirectories: [],
          intentFiles: [],
          otherFiles: [],
          sharedFiles: null,
        },
        path.join(projectRoot, 'ios')
      );

      const fileReferences = project.pbxFileReferenceSection();
      const infoPlistReferences = Object.keys(fileReferences)
        .filter((key) => key.endsWith('_comment') && fileReferences[key] === 'Info.plist')
        .map((key) => key.replace(/_comment$/, ''));

      expect(infoPlistReferences).toHaveLength(2);
      for (const fileRef of infoPlistReferences) {
        expect(groupsReferencing(project, fileRef)).toHaveLength(1);
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
