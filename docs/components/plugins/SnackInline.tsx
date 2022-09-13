import { css } from '@emotion/react';
import {
  spacing,
  theme,
  ArrowUpRightIcon,
  typography,
  borderRadius,
  iconSize,
  SnackLogo,
  shadows,
  breakpoints,
} from '@expo/styleguide';
import * as React from 'react';

import { SNACK_URL, getSnackFiles } from '~/common/snack';
import { PageApiVersionContext, PageApiVersionContextType } from '~/providers/page-api-version';
import { Button } from '~/ui/components/Button';
import { FOOTNOTE } from '~/ui/components/Text';

const DEFAULT_PLATFORM = 'android';
const LATEST_VERSION = `v${require('../../package.json').version}`;

type Props = React.PropsWithChildren<{
  dependencies: string[];
  label?: string;
  defaultPlatform?: string;
  templateId?: string;
  files?: Record<string, string>;
  platforms?: string[];
  buttonTitle?: string;
  contentHidden?: boolean;
}>;

export default class SnackInline extends React.Component<Props> {
  static contextType = PageApiVersionContext;
  contentRef = React.createRef<HTMLDivElement>();

  static defaultProps = {
    dependencies: [],
  };

  state = {
    ready: false,
  };

  componentDidMount() {
    // render the link only on the client side, because it depends on accessing DOM
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ ready: true });
  }

  // Filter out `latest` and use the concrete latest version instead. We want to
  // keep `unversioned` in for the selected docs version though. This is used to
  // find the examples in the static dir, and we don't have a `latest` version
  // there, but we do have `unversioned`.
  private getSelectedDocsVersion = () => {
    const { version } = this.context as PageApiVersionContextType;
    return version === 'latest' ? LATEST_VERSION : version;
  };

  // Get a SDK version that Snack will understand. `latest` and `unversioned`
  // are meaningless to Snack so we filter those out and use `LATEST_VERSION` instead
  private getSnackSdkVersion = () => {
    let version = this.getSelectedDocsVersion();
    if (version === 'unversioned') {
      version = LATEST_VERSION;
    }

    return version.replace('v', '');
  };

  private getExamplesPath = () => {
    return `${document.location.origin}/static/examples/${this.getSelectedDocsVersion()}`;
  };

  private getDependencies = () => {
    return [...this.props.dependencies].join(',');
  };

  private getCode = () => {
    const code = this.contentRef.current ? this.contentRef.current.textContent || '' : '';
    return code.replace(/%%placeholder-start%%.*%%placeholder-end%%/g, '');
  };

  render() {
    return (
      <div css={inlineSnackWrapperStyle}>
        <div css={[inlineSnackHeaderStyle, this.props.contentHidden && inlineSnackSoleHeaderStyle]}>
          <span css={inlineSnackTitleStyle}>{this.props.label || 'Example'}</span>
          <form action={SNACK_URL} method="POST" target="_blank">
            <input
              type="hidden"
              name="platform"
              value={this.props.defaultPlatform || DEFAULT_PLATFORM}
            />
            <input type="hidden" name="name" value={this.props.label || 'Example'} />
            <input type="hidden" name="dependencies" value={this.getDependencies()} />
            <input type="hidden" name="sdkVersion" value={this.getSnackSdkVersion()} />
            {this.props.platforms && (
              <input
                type="hidden"
                name="supportedPlatforms"
                value={this.props.platforms.join(',')}
              />
            )}
            {this.state.ready && (
              <input
                type="hidden"
                name="files"
                value={JSON.stringify(
                  getSnackFiles({
                    templateId: this.props.templateId,
                    code: this.getCode(),
                    files: this.props.files,
                    baseURL: this.getExamplesPath(),
                  })
                )}
              />
            )}
            <Button
              size="mini"
              theme="ghost"
              disabled={!this.state.ready}
              icon={<SnackLogo height={iconSize.regular} />}
              iconRight={<ArrowUpRightIcon size={iconSize.small} color={theme.icon.secondary} />}
              type="submit"
              css={snackButtonStyle}>
              <FOOTNOTE>{this.props.buttonTitle || 'Open in Snack'}</FOOTNOTE>
            </Button>
          </form>
        </div>
        <div ref={this.contentRef} css={this.props.contentHidden && css({ display: 'none' })}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

const inlineSnackWrapperStyle = css({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: spacing[3],

  pre: {
    marginTop: 0,
    borderTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

const inlineSnackHeaderStyle = css({
  display: 'flex',
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  padding: `${spacing[2]}px ${spacing[2.5]}px ${spacing[2]}px ${spacing[4]}px`,
  borderTopLeftRadius: borderRadius.small,
  borderTopRightRadius: borderRadius.small,
  justifyContent: 'space-between',

  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[1],
  },
});

const inlineSnackSoleHeaderStyle = css({
  borderRadius: borderRadius.small,
});

const inlineSnackTitleStyle = css({
  ...typography.fontSizes[16],
  fontFamily: typography.fontFaces.semiBold,
  color: theme.text.default,
});

const snackButtonStyle = css({
  borderColor: 'transparent',

  ':hover': {
    borderColor: theme.border.default,
    boxShadow: shadows.button,
  },
});
