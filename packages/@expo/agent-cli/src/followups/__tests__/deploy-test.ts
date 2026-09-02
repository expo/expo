import { buildDeployFollowUps } from '../deploy';

const launch = { url: 'https://launch.expo.dev/l/abc', expiresInHours: 8 };

describe(buildDeployFollowUps, () => {
  it(`should open the deployment and name the promotion command after a web deploy`, () => {
    expect(
      buildDeployFollowUps({ web: { url: 'https://my-app--7xk2m1.expo.app' }, launch: null })
    ).toEqual([
      expect.objectContaining({
        id: 'open-deployment',
        command: 'https://my-app--7xk2m1.expo.app',
      }),
      expect.objectContaining({ id: 'eas-deploy-prod', command: 'npx eas deploy --prod' }),
    ]);
  });

  it(`should still name the promotion command when no URL could be parsed`, () => {
    // A URL the parser missed is not a failed deploy, so the next step stays available.
    expect(buildDeployFollowUps({ web: { url: null }, launch: null })).toEqual([
      expect.objectContaining({ id: 'eas-deploy-prod' }),
    ]);
  });

  it(`should hand over the launch URL after a native deploy`, () => {
    const followups = buildDeployFollowUps({ web: null, launch });

    expect(followups).toEqual([
      expect.objectContaining({ id: 'open-launch-url', command: launch.url }),
    ]);
    // The URL is a required step, not a suggestion, and it does not wait forever.
    expect(followups[0]!.why).toContain('browser');
    expect(followups[0]!.why).toContain('8 hours');
  });

  it(`should put the launch first when both targets shipped`, () => {
    // The web deployment is already live; the launch is unfinished until someone opens it.
    const followups = buildDeployFollowUps({ web: { url: 'https://my-app.expo.app' }, launch });

    expect(followups.map((followup) => followup.id)).toEqual([
      'open-launch-url',
      'open-deployment',
      'eas-deploy-prod',
    ]);
  });

  it(`should never print more than the three lines a follow-up block allows`, () => {
    expect(buildDeployFollowUps({ web: { url: 'https://my-app.expo.app' }, launch })).toHaveLength(
      3
    );
  });

  it(`should return nothing when neither target ran`, () => {
    expect(buildDeployFollowUps({ web: null, launch: null })).toEqual([]);
  });
});
