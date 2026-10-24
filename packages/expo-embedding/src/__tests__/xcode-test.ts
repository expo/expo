import { Project, selectHost, attachSubproject } from '../xcode';

describe('Generating Xcode subprojects without Ruby', () => {
  it('should reuse a shared source reference across framework targets', () => {
    const project = Project.create();
    const first = project.addTarget('First', 'com.apple.product-type.framework', ['Debug']);
    const second = project.addTarget('Second', 'com.apple.product-type.framework', ['Debug']);
    for (const target of [first, second]) {
      const file = project.addFile(project.root.mainGroup, '/package/Shared.swift');
      project.addBuildFile(project.phase(target, 'PBXSourcesBuildPhase'), file);
    }
    expect(
      project
        .entries('PBXFileReference')
        .filter(([, file]) => file.path === '/package/Shared.swift')
    ).toHaveLength(1);
    expect(project.entries('PBXBuildFile')).toHaveLength(2);
  });
  function fixture() {
    const host = Project.create();
    const app = host.addTarget('Example', 'com.apple.product-type.application', [
      'Debug',
      'Release',
    ]);
    const extra = host.addTarget('Other', 'com.apple.product-type.application', [
      'Debug',
      'Release',
    ]);
    const sub = Project.create();
    const framework = sub.addTarget('expoappbrownfield', 'com.apple.product-type.framework', [
      'Debug',
      'Release',
    ]);
    return { host, app, extra, sub, framework };
  }
  it('should keep semantic target identifiers stable as unrelated targets are added', () => {
    const a = Project.create();
    const b = Project.create();
    const first = a.addTarget('One', 'com.apple.product-type.framework', ['Debug']);
    b.addTarget('Extra', 'com.apple.product-type.framework', ['Debug']);
    expect(b.addTarget('One', 'com.apple.product-type.framework', ['Debug'])).toBe(first);
  });
  it('should attach the subproject once and preserve other targets', () => {
    const { host, app, extra, sub, framework } = fixture();
    const original = JSON.stringify(host.object(extra));
    attachSubproject(host, app, sub, framework);
    const once = host.serialize();
    attachSubproject(host, app, sub, framework);
    expect(host.serialize()).toBe(once);
    expect(JSON.stringify(host.object(extra))).toBe(original);
    expect(host.object(app).dependencies).toHaveLength(1);
    expect(Project.parse(once).object(app).name).toBe('Example');
  });
  it('should reject ambiguous targets and unmapped configurations', () => {
    const { host, app } = fixture();
    expect(() => selectHost(host, '', {})).toThrow('--target');
    expect(selectHost(host, 'Example', {}).target).toBe(app);
    host.configurations(app)[0].name = 'Staging';
    expect(() => selectHost(host, 'Example', {})).toThrow('Staging');
    expect(selectHost(host, 'Example', { Staging: 'Release' }).configurations.Staging).toBe(
      'Release'
    );
  });
  it('should reject attaching an existing integration to another target', () => {
    const { host, app, sub, framework } = fixture();
    attachSubproject(host, app, sub, framework);
    expect(() => selectHost(host, 'Other', {})).toThrow('another target');
  });
});
