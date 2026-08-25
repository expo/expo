import withLocation, { type Props } from '../withLocation';

const MOTION_KEY = 'NSMotionUsageDescription';
const DEFAULT_MOTION_MESSAGE = 'Allow $(PRODUCT_NAME) to detect your current motion activity';

async function applyInfoPlistModAsync(props: Props, infoPlist: Record<string, any> = {}) {
  const config = withLocation({ name: 'test', slug: 'test' }, props) as any;
  const { modResults } = await config.mods.ios.infoPlist({
    modRequest: {},
    modResults: infoPlist,
  });
  return modResults;
}

describe('withLocation motionUsagePermission', () => {
  it(`adds the default message when the option is omitted`, async () => {
    const infoPlist = await applyInfoPlistModAsync({});
    expect(infoPlist[MOTION_KEY]).toBe(DEFAULT_MOTION_MESSAGE);
  });

  it(`uses the string that the option provides`, async () => {
    const infoPlist = await applyInfoPlistModAsync({ motionUsagePermission: 'Custom message' });
    expect(infoPlist[MOTION_KEY]).toBe('Custom message');
  });

  it(`keeps a manual Info.plist value when the option is omitted`, async () => {
    const infoPlist = await applyInfoPlistModAsync({}, { [MOTION_KEY]: 'Manual message' });
    expect(infoPlist[MOTION_KEY]).toBe('Manual message');
  });

  it(`deletes the key when the option is false`, async () => {
    const infoPlist = await applyInfoPlistModAsync({ motionUsagePermission: false });
    expect(infoPlist).not.toHaveProperty(MOTION_KEY);
  });

  it(`deletes a manual Info.plist value when the option is false`, async () => {
    const infoPlist = await applyInfoPlistModAsync(
      { motionUsagePermission: false },
      { [MOTION_KEY]: 'Manual message' }
    );
    expect(infoPlist).not.toHaveProperty(MOTION_KEY);
  });
});
