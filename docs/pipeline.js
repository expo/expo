import git from 'git-promise';
import spawnAsync from '@exponent/spawn-async';
import CI, { Rocker, Kubernetes as K8S, Log } from 'ci';

export default {
  config: {
    name: 'Next Docs',
    shortname: 'next-docs',
    description: 'Next Docs',
    branches: 'master',
    allowPRs: true,
    regions: ['docs/**'],
  },
  steps: (branch, tag, pr) => {
    if (tag) {
      // all we need to do when there's a tag is deploy
      return [deploy(branch, tag, 'production'), CI.waitStep(), updateSearchIndex(branch, tag, pr)];
    }

    // For PRs, immediately build but don't deploy
    let steps = [build(branch, tag, pr)];

    // If this is not a pull request, first, deploy to staging and then, tag release and deploy to production
    // once that step is unblocked
    // if (!pr) {
    if (pr) {
      steps = [
        ...steps,
        CI.waitStep(),
        deploy(branch, tag, 'staging'),
        CI.blockStep(':shipit: Deploy to Production?'),
        tagRelease,
      ];
    }
    return steps;
  },
};

const IMAGE_NAME = 'gcr.io/exponentjs/exponent-docs-v2';

const build = (branch, tag, pr) => ({
  name: ':hammer: Build',
  agents: {
    queue: 'builder',
  },
  async command() {
    const imageTag = `${process.env.BUILDKITE_COMMIT}`;

    Log.collapsed(':docker: Building...');

    await Rocker.build({
      rockerfile: './Rockerfile',
      context: './',
      vars: {
        ImageName: IMAGE_NAME,
        ImageTag: imageTag,
      },
      options: {
        pull: true,
        push: true,
      },
    });
  },
});

const deploy = (branch, tag, environment) => ({
  name: ':kubernetes: Deploy',
  agents: {
    queue: 'builder',
  },
  async command() {
    Log.collapsed(':kubernetes: Deploying...');

    const imageTag = `${process.env.BUILDKITE_COMMIT}`;
    const replicaCount = environment === 'production' ? 2 : 1;
    const appVersion = await makeVersionName();

    let ingressHostname;
    if (environment === 'production') {
      ingressHostname = 'next-docs.expo.io';
    } else {
      ingressHostname = 'staging.next-docs.expo.io';
    }

    await K8S.deployHelmChart({
      clusterName: 'exp-central',
      chartPath: './deploy/charts/docs',
      namespace: 'next-docs',
      releaseName: `next-docs-${environment}`,
      values: {
        image: {
          repository: IMAGE_NAME,
          tag: imageTag,
        },
        replicaCount,
        ingress: [
          {
            host: ingressHostname,
          },
        ],
        additionalEnv: [
          {
            name: 'GIT_COMMIT',
            value: process.env.BUILDKITE_COMMIT,
          },
          {
            name: 'APP_VERSION',
            value: appVersion,
          },
          {
            name: 'RELEASE_ID',
            value: md5(appVersion),
          },
        ],
      },
    });
  },
});

async function makeVersionName() {
  const hash = (await git('rev-parse --short=12 HEAD')).trim();

  const pad = n => {
    return n < 10 ? `0${n}` : `${n}`;
  };

  const today = new Date();
  const currentDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate()
  )}`;
  return `${currentDateStr}-${hash}`;
}

function md5(val) {
  return require('crypto')
    .createHash('md5')
    .update(val)
    .digest('hex');
}

const updateSearchIndex = (branch, tag, pr) => ({
  name: `:feelsgood: Update Search Index`,
  async command() {
    if (branch !== 'master' && !tag) {
      return;
    }

    Log.collapsed(':open_mouth: Updating search index...');

    await spawnAsync('yarn', ['run', 'update-search-index', '--', 'next-docs.expo.io'], {
      stdio: 'inherit',
    });
  },
});

const tagRelease = {
  name: ':git: Tag Release',
  async command() {
    Log.collapsed(':git: Tagging Release...'); // Build tag name
    const tag = `next-docs/release-${await makeVersionName()}`;
    await git(`tag ${tag}`);
    Log.collapsed(':github: Pushing Release...');
    await git(`push origin ${tag}`); // upload more steps
    await global.currentPipeline.upload(await global.currentPipeline.steps(tag, tag, null));
  },
};
