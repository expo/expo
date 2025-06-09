import { toValidAndroidResourceName } from '../utils';

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
