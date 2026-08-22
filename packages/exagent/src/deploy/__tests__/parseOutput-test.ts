import { outputTail, parseDeploymentUrl } from '../parseOutput';

describe(parseDeploymentUrl, () => {
  it(`should read a labelled deployment URL`, () => {
    const output = [
      'Exporting...',
      'Dashboard: https://expo.dev/projects/my-app/hosting/deployments',
      'Deployment URL: https://my-app--7xk2m1.expo.app',
      '',
    ].join('\n');

    expect(parseDeploymentUrl(output)).toBe('https://my-app--7xk2m1.expo.app');
  });

  it(`should read an unlabelled hosting URL`, () => {
    expect(parseDeploymentUrl('Your app is live at https://my-app.expo.app now.')).toBe(
      'https://my-app.expo.app'
    );
  });

  it(`should ignore the color codes of a terminal`, () => {
    expect(parseDeploymentUrl('\u001b[32mDeployment URL\u001b[0m: https://a--b.expo.app')).toBe(
      'https://a--b.expo.app'
    );
  });

  it(`should strip the punctuation that follows a URL in a sentence`, () => {
    expect(parseDeploymentUrl('Deployed to https://my-app.expo.app.')).toBe(
      'https://my-app.expo.app'
    );
  });

  it(`should prefer the last URL, which is the one the run ended on`, () => {
    const output = ['https://old--1.expo.app', 'https://new--2.expo.app'].join('\n');

    expect(parseDeploymentUrl(output)).toBe('https://new--2.expo.app');
  });

  it(`should return null when the output holds no hosting URL`, () => {
    expect(parseDeploymentUrl('Deployment failed.')).toBeNull();
    expect(parseDeploymentUrl('See https://expo.dev/projects/my-app for details')).toBeNull();
  });
});

describe(outputTail, () => {
  it(`should keep the last lines, which hold the result`, () => {
    expect(outputTail('one\ntwo\nthree\nfour\n', 2)).toBe('three\nfour');
  });

  it(`should drop the color codes and the blank lines of a terminal`, () => {
    expect(outputTail('\u001b[32mdone\u001b[0m\n\n\n', 2)).toBe('done');
  });

  it(`should return an empty string for no output`, () => {
    expect(outputTail('', 5)).toBe('');
  });
});
