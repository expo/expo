/* global CI, git, Promise, spawnAsync */

const {
  Docker,
  Log,
} = CI;

export default {
  config: {
    name: '📚 Docs',
    shortname: 'docs',
    description: 'Docs Build/Deploy',
    branches: 'master',
  },
  steps: (branch, tag) => ([
    build(branch, tag),
    CI.waitStep(),
    deploy(branch, tag),
    CI.waitStep(),
    updateSearchIndex(branch, tag),
  ]),
};

const build = (branch, tag) => ({
  name: `:hammer: Build`,
  agents: {
    queue: 'builder',
  },
  async command() {
    const imageName = `gcr.io/exponentjs/docs`;
    const imageTag = `${process.env.BUILDKITE_COMMIT}`;

    Log.collapsed(':hammer: Building Docs...');

    const buildScript = `make all`;

    await Docker.runInContainer({
      image: 'gcr.io/exponentjs/docs-builder:latest',
      volumes: {
        [`${CI.getBuildDir()}`]: '/root/docs',
      },
    }, buildScript);

    Log.collapsed(':docker: Building docker image...');

    await Docker.build({
      imageName,
      imageTag,
      context: '.',
      args: {
        DOCS_VERSION: `v${require('./package.json').version}`,
      },
    });

    await Docker.push({ imageName, imageTag });
  },
});

const deploy = (branch, tag) => ({
  name: `:rocket: Deploy`,
  async command() {
    if (branch !== 'master' && !tag) {
      return;
    }

    const imageName = `gcr.io/exponentjs/docs`;
    const imageTag = `${process.env.BUILDKITE_COMMIT}`;

    const deployScript = `#!/bin/bash
set -eo pipefail
appExists=$(kubectl get deployments -l app=$APP_NAME -o name --namespace=$KUBE_NAMESPACE)
if [ "$appExists" != "" ]; then
  envsubst < ./deploy/k8s/docs-deployment.template.yml | kubectl apply --record -f -
else # create the app deployment
  envsubst < ./deploy/k8s/docs-deployment.template.yml | kubectl create --record -f -
fi`;

    await Docker.runInContainer({
      image: 'gcr.io/exponentjs/deployer',
      env: {
        DOCKER_IMAGE: imageName,
        DOCKER_TAG: imageTag,
        APP_NAME: 'docs',
        KUBE_NAMESPACE: 'production',
        COMMIT_HASH: process.env.BUILDKITE_COMMIT,
      },
      volumes: {
        [CI.getBuildDir()]: '/workdir',
      },
    }, deployScript);
  },
});

const updateSearchIndex = (branch, tag) => ({
  name: `:feelsgood: Update Search Index`,
  async command() {
    if (branch !== 'master' && !tag) {
      return;
    }

    Log.collapsed(':timer_clock: Waiting 10 seconds...');

    await setTimeoutAsync(10000);

    Log.collapsed(':open_mouth: Updating search index...');

    await spawnAsync('node', [
      'scripts/update-search-index.js',
    ], {
      stdio: 'inherit',
    });
  },
});

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

async function makeVersionName() {
  const hash = (await git('rev-parse --short=12 HEAD')).trim();
  const today = new Date();

  return `${today.getFullYear()}-` +
    `${pad(today.getMonth() + 1)}-${pad(today.getDate())}-${hash}`;
}

function setTimeoutAsync(timeout) {
  return new Promise(resolve => {
    setTimeout(() => { resolve(); }, timeout);
  });
}
