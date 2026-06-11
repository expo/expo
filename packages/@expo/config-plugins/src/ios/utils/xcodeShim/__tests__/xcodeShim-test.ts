import path from 'path';

import { project as projectShim } from '..';

const fixturePath = path.resolve(
  __dirname,
  '../../../../../../../../templates/expo-template-bare-minimum/ios/HelloWorld.xcodeproj/project.pbxproj'
);

describe('XcodeProjectShim', () => {
  describe('lifecycle', () => {
    it('opens and round-trips a real pbxproj', () => {
      const project = projectShim(fixturePath).parseSync();
      expect(project.filepath).toBe(fixturePath);

      const output = project.writeSync();
      expect(output.startsWith('// !$*UTF8*$!')).toBe(true);
      expect(output.length).toBeGreaterThan(1000);
    });
  });

  describe('section accessors', () => {
    it('pbxNativeTargetSection returns uuid + _comment entries', () => {
      const project = projectShim(fixturePath).parseSync();
      const section = project.pbxNativeTargetSection();
      const keys = Object.keys(section);

      const uuids = keys.filter((k) => !k.endsWith('_comment'));
      const comments = keys.filter((k) => k.endsWith('_comment'));

      expect(uuids.length).toBeGreaterThan(0);
      expect(comments.length).toBe(uuids.length);

      // Application target has name HelloWorld
      const helloWorld = uuids.find((u) => section[`${u}_comment`] === 'HelloWorld');
      expect(helloWorld).toBeDefined();

      const target = section[helloWorld!];
      expect(target.productType).toContain('com.apple.product-type.application');
      // buildConfigurationList should be exposed as a UUID string (legacy shape)
      expect(typeof target.buildConfigurationList).toBe('string');
    });

    it('pbxXCBuildConfigurationSection exposes mutable buildSettings', () => {
      const project = projectShim(fixturePath).parseSync();
      const section = project.pbxXCBuildConfigurationSection();
      const uuids = Object.keys(section).filter((k) => !k.endsWith('_comment'));
      expect(uuids.length).toBeGreaterThan(0);

      const cfg = section[uuids[0]];
      expect(typeof cfg.name).toBe('string');
      expect(cfg.buildSettings).toBeDefined();

      // Mutation writes through
      cfg.buildSettings.DEVELOPMENT_TEAM = 'XXXXXXXXXX';
      const output = project.writeSync();
      expect(output).toContain('DEVELOPMENT_TEAM = XXXXXXXXXX');
    });

    it('pbxXCConfigurationList resolves a list and its build configurations', () => {
      const project = projectShim(fixturePath).parseSync();
      const targetSection = project.pbxNativeTargetSection();
      const targetUuid = Object.keys(targetSection).find((k) => !k.endsWith('_comment'))!;
      const target = targetSection[targetUuid];

      const lists = project.pbxXCConfigurationList();
      const list = lists[target.buildConfigurationList];
      expect(list).toBeDefined();

      // legacy {value, comment}[] shape for buildConfigurations
      expect(Array.isArray(list.buildConfigurations)).toBe(true);
      const buildConfigIds = list.buildConfigurations.map((i: any) => i.value);
      expect(buildConfigIds.length).toBeGreaterThanOrEqual(2);

      // The referenced build configs exist in pbxXCBuildConfigurationSection
      const cfgSection = project.pbxXCBuildConfigurationSection();
      for (const id of buildConfigIds) {
        expect(cfgSection[id]).toBeDefined();
      }
    });
  });

  describe('quote translation on write', () => {
    it('strips outer quotes from incoming build setting values', () => {
      const project = projectShim(fixturePath).parseSync();
      const section = project.pbxXCBuildConfigurationSection();
      const cfg = section[Object.keys(section).filter((k) => !k.endsWith('_comment'))[0]];

      // Legacy-style write with surrounding quotes
      cfg.buildSettings.PRODUCT_NAME = '"MyCoolThing"';
      const output = project.writeSync();
      // Output must NOT have escaped double quotes (which would mean the value
      // was re-quoted as a string containing literal quotes).
      expect(output).not.toContain('PRODUCT_NAME = "\\"MyCoolThing\\"";');
      // The bare or auto-quoted form is acceptable depending on the heuristic.
      expect(output).toMatch(/PRODUCT_NAME = (MyCoolThing|"MyCoolThing");/);
    });
  });
});
