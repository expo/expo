import { buildDeployFollowUps } from '../deploy';

describe(buildDeployFollowUps, () => {
  it(`should open the deployment and name the promotion command after a web deploy`, () => {
    expect(
      buildDeployFollowUps({ web: { url: 'https://my-app--7xk2m1.expo.app' }, native: null })
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
    expect(buildDeployFollowUps({ web: { url: null }, native: null })).toEqual([
      expect.objectContaining({ id: 'eas-deploy-prod' }),
    ]);
  });

  it(`should point at the build page and the store submission after a native build`, () => {
    expect(
      buildDeployFollowUps({
        web: null,
        native: { platform: 'ios', buildUrl: 'https://expo.dev/accounts/a/projects/b/builds/c' },
      })
    ).toEqual([
      expect.objectContaining({
        id: 'open-build',
        command: 'https://expo.dev/accounts/a/projects/b/builds/c',
      }),
      expect.objectContaining({
        id: 'eas-submit',
        command: 'npx eas submit --platform ios --latest',
      }),
    ]);
  });

  it(`should name the platform that was built in the submit command`, () => {
    const followups = buildDeployFollowUps({
      web: null,
      native: { platform: 'android', buildUrl: null },
    });

    expect(followups).toEqual([
      expect.objectContaining({
        id: 'eas-submit',
        command: 'npx eas submit --platform android --latest',
      }),
    ]);
  });

  it(`should cap a deploy of both targets at three follow-ups`, () => {
    const followups = buildDeployFollowUps({
      web: { url: 'https://my-app.expo.app' },
      native: { platform: 'ios', buildUrl: 'https://expo.dev/accounts/a/projects/b/builds/c' },
    });

    expect(followups).toHaveLength(3);
    expect(followups.map((followup) => followup.id)).toEqual([
      'open-deployment',
      'eas-deploy-prod',
      'open-build',
    ]);
  });

  it(`should return nothing when neither target ran`, () => {
    expect(buildDeployFollowUps({ web: null, native: null })).toEqual([]);
  });
});
