import { vol } from 'memfs';

import { parseXcodeBuildProducts, resolveInstallAppPathAsync } from '../resolveInstallAppPath';

const props = {
  projectRoot: '/project',
  scheme: 'MyApp',
  xcodeProject: { name: '/project/ios/MyApp.xcodeproj', isWorkspace: false },
};
const schemePath = '/project/ios/MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme';

const projectPath = '/project/ios/MyApp.xcodeproj';
const products = [
  { projectPath, targetName: 'MyApp', appPath: '/built/My App.app' },
  { projectPath, targetName: 'Clip', appPath: '/built/Clip.app' },
];

function projectFile(targetName = 'MyApp'): string {
  return `{
  objects = {
/* Begin PBXNativeTarget section */
    A10000000000000000000001 = { isa = PBXNativeTarget; name = "${targetName}"; };
/* End PBXNativeTarget section */
  };
}
`;
}

function schemeXml(appName: string, referencedContainer = 'container:MyApp.xcodeproj'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme version="1.3">
  <LaunchAction>
    <BuildableProductRunnable>
      <BuildableReference BuildableName="${appName}" BlueprintName="CachedTargetName" BlueprintIdentifier="A10000000000000000000001" ReferencedContainer="${referencedContainer}"/>
    </BuildableProductRunnable>
  </LaunchAction>
</Scheme>`;
}

beforeEach(() => vol.fromJSON({ [`${projectPath}/project.pbxproj`]: projectFile() }));
afterEach(() => vol.reset());

it('uses the only checked app without requiring a shared scheme', async () => {
  await expect(resolveInstallAppPathAsync(props, ['/built/My App.app'], [])).resolves.toBe(
    '/built/My App.app'
  );
});

it('selects the scheme runnable instead of the first compiled app', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).resolves.toBe('/built/My App.app');
});

it.each([
  [
    'another target has a section',
    '/* Begin PBXNativeTarget section */\n    B10000000000000000000002 = { isa = PBXNativeTarget; name = Clip; };\n/* End PBXNativeTarget section */',
  ],
  ['no target section exists', ''],
])('reads an ungrouped runnable target when %s', async (_description, groupedTargets) => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    [`${projectPath}/project.pbxproj`]: `{
  objects = {
${groupedTargets}
    A10000000000000000000001 = { isa = PBXNativeTarget; name = MyApp; };
  };
}
`,
  });

  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).resolves.toBe('/built/My App.app');
});

it.each([
  ['numeric name', '123', 'PBXNativeTarget', '123'],
  ['quoted name and type', '"My App"', '"PBXNativeTarget"', 'My App'],
  ['quoted numeric name', '"007"', 'PBXNativeTarget', '007'],
])('reads a runnable target with a %s', async (_description, name, isa, targetName) => {
  vol.fromJSON({
    [schemePath]: schemeXml('Cached.app'),
    [`${projectPath}/project.pbxproj`]: projectFile().replace(
      'isa = PBXNativeTarget; name = "MyApp";',
      `isa = ${isa}; name = ${name};`
    ),
  });

  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/Clip.app', '/built/My App.app'],
      [{ projectPath, targetName, appPath: '/built/My App.app' }]
    )
  ).resolves.toBe('/built/My App.app');
});

it.each([
  ['wrong target type', 'isa = PBXAggregateTarget; name = MyApp;', 'MyApp'],
  ['missing name', 'isa = PBXNativeTarget;', 'undefined'],
  ['empty name', 'isa = PBXNativeTarget; name = "";', ''],
  ['object name', 'isa = PBXNativeTarget; name = { value = MyApp; };', '[object Object]'],
])('rejects a runnable target with a %s', async (_description, fields, targetName) => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    [`${projectPath}/project.pbxproj`]: projectFile().replace(
      'isa = PBXNativeTarget; name = "MyApp";',
      fields
    ),
  });

  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/Clip.app', '/built/My App.app'],
      [{ projectPath, targetName, appPath: '/built/My App.app' }]
    )
  ).rejects.toMatchObject({ code: 'IOS_AMBIGUOUS_APP' });
});

it('rejects a target identifier repeated inside and outside the native target section', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    [`${projectPath}/project.pbxproj`]: projectFile().replace(
      '/* End PBXNativeTarget section */',
      `/* End PBXNativeTarget section */
    A10000000000000000000001 = { isa = PBXNativeTarget; name = MyApp; };`
    ),
  });

  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).rejects.toMatchObject({ code: 'IOS_AMBIGUOUS_APP' });
});

it('reads schemes stored in the selected workspace', async () => {
  const workspace = '/project/ios/MyApp.xcworkspace';
  vol.fromJSON({ [`${workspace}/xcshareddata/xcschemes/MyApp.xcscheme`]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: workspace, isWorkspace: true },
      },
      ['/built/Clip.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it('matches scheme names literally, including regex characters', async () => {
  const literalScheme = '/project/ios/MyApp.xcodeproj/xcshareddata/xcschemes/App (dev).xcscheme';
  vol.fromJSON({ [literalScheme]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      { ...props, scheme: 'App (dev)' },
      ['/built/Clip.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it('rejects a runnable target ID that is absent from its project', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('Other.app').replace(
      'A10000000000000000000001',
      'B10000000000000000000002'
    ),
  });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).rejects.toThrow('Cannot select an app to install');
});

it('selects identical product names using the resolved build path', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/a/My App.app', '/built/b/My App.app'],
      [
        { projectPath, targetName: 'MyApp', appPath: '/built/b/My App.app' },
        { projectPath, targetName: 'Clip', appPath: '/built/a/My App.app' },
      ]
    )
  ).resolves.toBe('/built/b/My App.app');
});

it('ignores same-name schemes in other projects when a project was selected', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    '/project/ios/Other.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': schemeXml('Other.app'),
  });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Other.app', '/built/My App.app'], products)
  ).resolves.toBe('/built/My App.app');
});

it('resolves relative project paths from the project root', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: 'ios/MyApp.xcodeproj', isWorkspace: false },
      },
      ['/built/Other.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it.each([
  ['MyApp.xcodeproj', false],
  ['MyApp.xcworkspace', true],
] as const)('reads user schemes from the selected %s', async (container, isWorkspace) => {
  const containerPath = `/project/ios/${container}`;
  vol.fromJSON({
    [`${containerPath}/xcuserdata/test.xcuserdatad/xcschemes/MyApp.xcscheme`]:
      schemeXml('My App.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: containerPath, isWorkspace },
      },
      ['/built/Other.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it('reads project user schemes from a workspace', async () => {
  vol.fromJSON({
    '/project/ios/MyApp.xcodeproj/xcuserdata/test.xcuserdatad/xcschemes/MyApp.xcscheme':
      schemeXml('My App.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: '/project/ios/MyApp.xcworkspace', isWorkspace: true },
      },
      ['/built/Other.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it('reports ambiguity when a workspace has multiple matching scheme definitions', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    '/project/ios/Other.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': schemeXml('Other.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: '/project/ios/MyApp.xcworkspace', isWorkspace: true },
      },
      ['/built/Other.app', '/built/My App.app'],
      products
    )
  ).rejects.toThrow('Cannot select an app to install');
});

it.each([
  '<Scheme/>',
  '<Scheme><LaunchAction>',
  schemeXml('My App.app', 'container:MyApp.xcworkspace'),
])('rejects missing or malformed runnable metadata: %s', async (xml) => {
  vol.fromJSON({ [schemePath]: xml });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).rejects.toThrow('Cannot select an app to install');
});

it('rejects an absent scheme for multiple artifacts', async () => {
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'], products)
  ).rejects.toThrow('Cannot select an app to install');
});

it('uses resolved product names and target identity instead of cached scheme names', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/Clip.app', '/built/MyApp-Debug.app'],
      [
        { projectPath, targetName: 'MyApp', appPath: '/built/MyApp-Debug.app' },
        { projectPath, targetName: 'Clip', appPath: '/built/Clip.app' },
      ]
    )
  ).resolves.toBe('/built/MyApp-Debug.app');
});

it('distinguishes the same target name and ID in different projects', async () => {
  const otherProject = '/project/ios/Other.xcodeproj';
  vol.fromJSON({
    [schemePath]: schemeXml('Cached.app', 'container:Other.xcodeproj'),
    [`${otherProject}/project.pbxproj`]: projectFile(),
  });
  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/a/MyApp.app', '/built/b/MyApp.app'],
      [
        { projectPath, targetName: 'MyApp', appPath: '/built/a/MyApp.app' },
        { projectPath: otherProject, targetName: 'MyApp', appPath: '/built/b/MyApp.app' },
      ]
    )
  ).resolves.toBe('/built/b/MyApp.app');
});

it('resolves a project reference relative to its workspace', async () => {
  const workspace = '/project/ios/Workspace/MyApp.xcworkspace';
  vol.fromJSON({
    [`${workspace}/xcshareddata/xcschemes/MyApp.xcscheme`]: schemeXml(
      'My App.app',
      'container:../MyApp.xcodeproj'
    ),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: workspace, isWorkspace: true },
      },
      ['/built/Clip.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});

it.each(['xcshareddata/xcschemes', 'xcuserdata/test.xcuserdatad/xcschemes'])(
  'finds a nested project scheme in %s from workspace build settings',
  async (schemeDirectory) => {
    const nestedProject = '/project/ios/Targets/MyApp.xcodeproj';
    vol.fromJSON({
      [`${nestedProject}/project.pbxproj`]: projectFile(),
      [`${nestedProject}/${schemeDirectory}/MyApp.xcscheme`]: schemeXml('My App.app'),
    });

    await expect(
      resolveInstallAppPathAsync(
        {
          ...props,
          xcodeProject: { name: '/project/ios/MyApp.xcworkspace', isWorkspace: true },
        },
        ['/built/Clip.app', '/built/My App.app'],
        products.map((product) => ({ ...product, projectPath: nestedProject }))
      )
    ).resolves.toBe('/built/My App.app');
  }
);

it('only returns paths verified by Compile', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/Other.app'], products)
  ).rejects.toThrow('Cannot select an app to install');
});

it('rejects multiple paths for the same runnable target', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/a/MyApp.app', '/built/b/MyApp.app'],
      [
        { projectPath, targetName: 'MyApp', appPath: '/built/a/MyApp.app' },
        { projectPath, targetName: 'MyApp', appPath: '/built/b/MyApp.app' },
      ]
    )
  ).rejects.toThrow('Cannot select an app to install');
});

it('reads app projects, targets, and paths from build settings', () => {
  const output = JSON.stringify([
    {
      target: 'MyApp',
      buildSettings: {
        PROJECT_FILE_PATH: 'ios/MyApp.xcodeproj',
        TARGET_BUILD_DIR: '/built',
        WRAPPER_NAME: 'MyApp-Debug.app',
      },
    },
    { target: 'Framework', buildSettings: { WRAPPER_NAME: 'Framework.framework' } },
    { target: 'Aggregate', buildSettings: {} },
    {
      target: 'MissingIdentity',
      buildSettings: { WRAPPER_NAME: 'Other.app', TARGET_BUILD_DIR: '/built' },
    },
  ]);
  expect(parseXcodeBuildProducts(output, '/project')).toEqual([
    { projectPath, targetName: 'MyApp', appPath: '/built/MyApp-Debug.app' },
  ]);
});

it.each(['not JSON', '{}'])('rejects invalid Xcode build settings: %s', (output) => {
  expect(() => parseXcodeBuildProducts(output, '/project')).toThrow();
});

it('reports an app selection error when its build settings reference a missing project', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      props,
      ['/built/Clip.app', '/built/My App.app'],
      [
        {
          projectPath: '/project/ios/Missing.xcodeproj',
          targetName: 'MyApp',
          appPath: '/built/My App.app',
        },
      ]
    )
  ).rejects.toMatchObject({ code: 'IOS_AMBIGUOUS_APP', cause: { code: 'ENOENT' } });
});

it('treats symlink aliases of the same workspace scheme as one definition', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  vol.symlinkSync('/project', '/project-alias');
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        projectRoot: '/project-alias',
        xcodeProject: { name: '/project-alias/ios/MyApp.xcworkspace', isWorkspace: true },
      },
      ['/built/Clip.app', '/built/My App.app'],
      products
    )
  ).resolves.toBe('/built/My App.app');
});
