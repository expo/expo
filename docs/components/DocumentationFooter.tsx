import { css } from '@emotion/core';
import * as React from 'react';

import * as Constants from '~/constants/theme';
import { Url } from '~/types/common';

const STYLES_FOOTER = css`
  border-top: 1px solid ${Constants.expoColors.gray[250]};
  padding: 24px 0 24px 0;
`;

const STYLES_FOOTER_LINK = css`
  display: block;
  text-decoration: none;
  margin-bottom: 12px;
`;

// Remove trailing slash and append .md
function githubUrl(path: string) {
  if (path.includes('/versions/latest/')) {
    if (path === '/versions/latest') {
      path = '/versions/unversioned/index';
    } else {
      path = path.replace('/versions/latest/', '/versions/unversioned/');
    }
  } else if (path.match(/v\d+\.\d+\.\d+\/?$/) || path === '/') {
    if (path[path.length - 1] === '/') {
      path = `${path}index`;
    } else {
      path = `${path}/index`;
    }
  }

  let pathAsMarkdown = path.replace(/\/$/, '') + '.md';
  if (pathAsMarkdown.startsWith('/versions/latest')) {
    pathAsMarkdown = pathAsMarkdown.replace('/versions/latest', '/versions/unversioned');
  }

  return `https://github.com/expo/expo/edit/master/docs/pages${pathAsMarkdown}`;
}

// Add any page in the /sdk/ section that should not have an issues link to this
const ISSUES_BLACKLIST = ['Overview'];

type Props = {
  asPath: string;
  url?: Url;
  title: string;
  sourceCodeUrl?: string;
};

export default class DocumentationFooter extends React.PureComponent<Props> {
  render() {
    return (
      <footer css={STYLES_FOOTER}>
        <a css={STYLES_FOOTER_LINK} target="_blank" rel="noopener" href="https://forums.expo.io/">
          Ask a question on the forums
        </a>
        {this.maybeRenderIssuesLink()}
        {this.maybeRenderSourceCodeLink()}
        {this.maybeRenderGithubUrl()}
      </footer>
    );
  }

  private maybeRenderGithubUrl() {
    if (this.props.url) {
      return (
        <a
          css={STYLES_FOOTER_LINK}
          target="_blank"
          rel="noopener"
          href={githubUrl(this.props.url.pathname)}>
          Edit this page
        </a>
      );
    }
  }

  private maybeRenderIssuesLink = () => {
    if (!this.props.asPath.includes('/sdk/') || ISSUES_BLACKLIST.includes(this.props.title)) {
      return;
    }

    return (
      <a
        css={STYLES_FOOTER_LINK}
        target="_blank"
        href={`https://github.com/expo/expo/labels/${this.props.title}`}>
        View open issues for {this.props.title}
      </a>
    );
  };

  private maybeRenderSourceCodeLink = () => {
    if (!this.props.asPath.includes('/sdk/') || !this.props.sourceCodeUrl) {
      return;
    }

    return (
      <a css={STYLES_FOOTER_LINK} target="_blank" href={`${this.props.sourceCodeUrl}`}>
        View source code for {this.props.title}
      </a>
    );
  };
}
