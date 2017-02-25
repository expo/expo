import spawnAsync from '@exponent/spawn-async';

import CI, { Rocker, Docker, Log, Github } from 'ci';

export default {
  config: {
    name: '📚 Docs',
    shortname: 'docs',
    description: 'Docs Build/Deploy',
    branches: 'master',
    allowPRs: true,
  },
  steps: (branch, tag, pr) => {
    if (tag) {
      // all we need to do when there's a tag is deploy
      return [deploy(branch, tag, pr), updateSearchIndex(branch, tag, pr)];
    }
    const steps = [build(branch, tag, pr), CI.waitStep(), deploy(branch, tag, pr)];
    if (!pr) {
      steps.push(CI.blockStep(':shipit: Deploy to Production?'), tagRelease);
    }
    return steps;
  },
};

const build = (branch, tag, pr) => ({
  name: `:hammer: Build`,
  agents: {
    queue: 'builder',
  },
  async command() {
    let environment;
    if (tag && !pr) {
      environment = 'production';
    } else if (pr) {
      environment = `docs-pr-${pr}`;
    } else {
      environment = 'staging';
    }

    const imageName = `gcr.io/exponentjs/exponent-docs-v2-${environment}`;
    const imageTag = `${process.env.BUILDKITE_COMMIT}`;

    Log.collapsed(':hammer: Building Docs...');

    await Rocker.build({
      rockerfile: './deploy/docker/deploy.Rockerfile',
      context: '.',
      vars: {
        ImageName: imageName,
        ImageTag: imageTag,
        DocsVersion: `v${require('./package.json').version}`,
      },
      options: {
        pull: true,
        push: true,
      },
    });
  },
});

const deploy = (branch, tag, pr) => ({
  name: `:rocket: Deploy to ${tag && !pr ? 'Production' : pr ? 'Dev' : 'Staging'}`,
  concurrency: 1,
  concurrency_group: `docs/${tag && !pr ? 'prod' : pr ? `pr-${pr}` : 'staging'}/deploy`,
  async command() {
    if (!pr && branch !== 'master') {
      return;
    }
    const isProduction = tag && !pr;

    let environment;
    if (tag && !pr) {
      environment = 'production';
    } else if (pr) {
      environment = `docs-pr-${pr}`;
    } else {
      environment = 'staging';
    }

    const imageName = `gcr.io/exponentjs/exponent-docs-v2-${environment}`;
    const imageTag = `${process.env.BUILDKITE_COMMIT}`;

    Log.collapsed(':gcloud: Deploy to K8s...');
    let currentGithubDeployment, deploymentUrl;
    if (pr) {
      // is PR
      await Github.setAllCurrentDeploymentsToInactive('universe', pr, {
        task: 'deploy:docs:k8s',
        environment,
      });
      currentGithubDeployment = await Github.createDeploymentForPR('universe', pr, {
        task: 'deploy:docs:k8s',
        environment,
        required_contexts: [],
      });
      deploymentUrl = `https://${environment}.pr.exp.host`;
    } else {
      currentGithubDeployment = await Github.createDeploymentForCommit('universe', process.env.BUILDKITE_COMMIT, {
        task: 'deploy:docs:k8s',
        environment,
        required_contexts: [],
        ...(environment === 'production' ? { production_environment: true } : {}),
      });
      deploymentUrl = environment === 'staging'
        ? 'https://staging.docs.getexponent.com/'
        : 'https://docs.getexponent.com';
    }

    await Github.createDeploymentStatus('universe', currentGithubDeployment, {
      state: 'pending',
      log_url: process.env.BUILDKITE_BUILD_URL,
      description: 'Currently deploying. Check CI for details.',
    });

    try {
      const deployScript = `#!/bin/bash
        set -eo pipefail

        echo "Beginning deployment..."

        nsExists=$(kubectl get ns | (grep "$KUBE_NAMESPACE" || true))
        if [ "$nsExists" == "" ]; then
          echo "Creating namespace..."
          envsubst < ./deploy/k8s/$APP_NAME.ns.template.yml | kubectl create --record -f -
        else
          echo "Namespace exists."
        fi

        serviceExists=$(kubectl get svc --namespace="$KUBE_NAMESPACE" | (grep $APP_NAME || true))
        if [ "$serviceExists" == "" ]; then
          echo "Creating service..."
          envsubst < ./deploy/k8s/$APP_NAME.svc.template.yml | kubectl create --record -f -
        else
          echo "Updating service..."
          envsubst < ./deploy/k8s/$APP_NAME.svc.template.yml | kubectl apply --record -f -
        fi

        ingressExists=$(kubectl get ing --namespace="$KUBE_NAMESPACE" | (grep $APP_NAME-ingress || true))
        if [ "$ingressExists" == "" ]; then
          echo "Creating ingress..."
          envsubst < ./deploy/k8s/$APP_NAME.ingress.template.yml | kubectl create --record -f -
        else
          echo "Updating ingress..."
          envsubst < ./deploy/k8s/$APP_NAME.ingress.template.yml | kubectl apply --record -f -
        fi

        appExists=$(kubectl get deployments -l app=$APP_NAME -o name --namespace=$KUBE_NAMESPACE)
        if [ "$appExists" != "" ]; then
          echo "Updating deployment..."
          envsubst < ./deploy/k8s/$APP_NAME.deployment.template.yml | kubectl apply --record -f -
        else # create the app deployment
          echo "Creating deployment..."
          envsubst < ./deploy/k8s/$APP_NAME.deployment.template.yml | kubectl create --record -f -
        fi

        wait-for-deployment $APP_NAME $KUBE_NAMESPACE 240
      `;

      await Docker.runInContainer(
        {
          image: 'gcr.io/exponentjs/deployer',
          env: {
            DOCKER_IMAGE: imageName,
            DOCKER_TAG: imageTag,
            APP_NAME: 'docs',
            KUBE_NAMESPACE: environment,
            COMMIT_HASH: process.env.BUILDKITE_COMMIT,
            NUM_REPLICAS: environment === 'production' ? 2 : 1, // PRS // Staging
            INGRESS_HOSTNAME: isProduction
              ? 'docs.getexponent.com'
              : pr
                  ? `${environment}.pr.exp.host`
                  : // prs
                    'staging.docs.getexponent.com', // staging
            VAULT_ADDR: process.env.VAULT_ADDR,
            VAULT_TOKEN: process.env.VAULT_TOKEN,
          },
          volumes: {
            [CI.getHostBuildDir()]: '/workdir',
          },
        },
        deployScript
      );
    } catch (e) {
      if (currentGithubDeployment) {
        await Github.createDeploymentStatus('universe', currentGithubDeployment, {
          state: 'error',
          log_url: process.env.BUILDKITE_BUILD_URL,
          description: 'Error during deployment. Check CI for details.',
        });
      }
      process.exit(1);
      return;
    }

    if (currentGithubDeployment) {
      await Github.createDeploymentStatus('universe', currentGithubDeployment, {
        state: 'success',
        log_url: process.env.BUILDKITE_BUILD_URL,
        environment_url: deploymentUrl,
        description: 'PR was deployed successfully',
      });
    }
  },
});

const updateSearchIndex = (branch, tag) => ({
  name: `:feelsgood: Update Search Index`,
  async command() {
    if (branch !== 'master' && !tag) {
      return;
    }

    Log.collapsed(':open_mouth: Updating search index...');

    await spawnAsync('node', ['scripts/update-search-index.js'], {
      stdio: 'inherit',
    });
  },
});

const tagRelease = {
  name: ':git: Tag Release',
  async command() {
    Log.collapsed(':git: Tagging Release...'); // Build tag name
    const tag = `docs/release-${await makeVersionName()}`;
    await git(`tag ${tag}`);
    Log.collapsed(':github: Pushing Release...');
    await git(`push origin ${tag}`); // upload more steps
    global.currentPipeline.upload(global.currentPipeline.steps(tag, tag, null));
  },
};

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

async function makeVersionName() {
  const hash = (await git('rev-parse --short=12 HEAD')).trim();
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}-${hash}`;
}
