import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveFontPaths, toValidAndroidResourceName } from '../utils';

describe(toValidAndroidResourceName, () => {
  it('converts strings to valid Android resource names', () => {
    // invalid characters
    expect(toValidAndroidResourceName('a-b-c d-e.ttf')).toBe('a_b_c_d_e');
    expect(toValidAndroidResourceName('font -- name')).toBe('font_name');

    expect(toValidAndroidResourceName('šššfont@2x.ttf')).toBe('_font_2x');
    expect(toValidAndroidResourceName('font123')).toBe('font123');

    expect(toValidAndroidResourceName('font!@#$%^&*()name.ttf')).toBe('font_name');
    expect(toValidAndroidResourceName('font\tname\ntest')).toBe('font_name_test');

    // Real-world font family examples
    expect(toValidAndroidResourceName('FiraSans-Bold.ttf')).toBe('fira_sans_bold');
    expect(toValidAndroidResourceName('SourceSerif4_36pt-Regular.ttf')).toBe(
      'source_serif4_36pt_regular'
    );
    expect(toValidAndroidResourceName('DeliusUnicase-Regular.ttf')).toBe('delius_unicase_regular');
    expect(toValidAndroidResourceName('AROneSans-VariableFont_ARRR,wght.ttf')).toBe(
      'ar_one_sans_variable_font_arrr_wght'
    );
    expect(toValidAndroidResourceName('SF Pro Display.ttf')).toBe('sf_pro_display');
    expect(toValidAndroidResourceName('Noto Sans JP')).toBe('noto_sans_jp');
  });
});

describe(resolveFontPaths, () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-font-plugin-'));
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('resolves relative file paths from the project root', async () => {
    const fontPath = path.join(projectRoot, 'assets', 'fonts', 'Inter.ttf');
    await fs.mkdir(path.dirname(fontPath), { recursive: true });
    await fs.writeFile(fontPath, '');

    await expect(resolveFontPaths(['./assets/fonts/Inter.ttf'], projectRoot)).resolves.toEqual([
      fontPath,
    ]);
  });

  it('expands directory contents and filters to supported font files', async () => {
    const fontsDir = path.join(projectRoot, 'assets', 'fonts');
    await fs.mkdir(fontsDir, { recursive: true });
    await fs.writeFile(path.join(fontsDir, 'Inter.ttf'), '');
    await fs.writeFile(path.join(fontsDir, 'Inter.otf'), '');
    await fs.writeFile(path.join(fontsDir, 'README.md'), '');

    const result = await resolveFontPaths(['./assets/fonts'], projectRoot);

    expect(result.sort()).toEqual([
      path.join(fontsDir, 'Inter.otf'),
      path.join(fontsDir, 'Inter.ttf'),
    ]);
  });

  it('resolves scoped package-style font paths relative to the project root', async () => {
    const fontPath = path.join(
      projectRoot,
      'node_modules',
      '@expo-google-fonts',
      'inter',
      '400Regular',
      'Inter_400Regular.ttf'
    );
    await fs.mkdir(path.dirname(fontPath), { recursive: true });
    await fs.writeFile(fontPath, '');

    await expect(
      resolveFontPaths(['@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'], projectRoot)
    ).resolves.toEqual([await fs.realpath(fontPath)]);
  });

  it('resolves unscoped package-style font paths relative to the project root', async () => {
    const fontPath = path.join(projectRoot, 'node_modules', 'some-font-package', 'fonts', 'Foo.ttf');
    await fs.mkdir(path.dirname(fontPath), { recursive: true });
    await fs.writeFile(fontPath, '');

    await expect(
      resolveFontPaths(['some-font-package/fonts/Foo.ttf'], projectRoot)
    ).resolves.toEqual([await fs.realpath(fontPath)]);
  });

  it('rejects missing font paths', async () => {
    await expect(resolveFontPaths(['./assets/fonts/Missing.ttf'], projectRoot)).rejects.toThrow();
  });
});
