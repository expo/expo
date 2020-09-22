import * as React from 'react';

import { SNACK_URL, getSnackFiles } from '../../common/snack';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { ExternalLink } from '~/components/icons/ExternalLink';

const DEFAULT_PLATFORM = 'android';
const LATEST_VERSION = `v${require('../../package.json').version}`;

export default class SnackInline extends React.Component {
  static contextType = DocumentationPageContext;
  contentRef = React.createRef();

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
  _getSelectedDocsVersion = () => {
    const { version } = this.context;

    return version === 'latest' ? LATEST_VERSION : version;
  };

  // Get a SDK version that Snack will understand. `latest` and `unversioned`
  // are meaningless to Snack so we filter those out and use `LATEST_VERSION` instead
  _getSnackSdkVersion = () => {
    let version = this._getSelectedDocsVersion();
    if (version === 'unversioned') {
      version = LATEST_VERSION;
    }

    // NOTE(brentvatne): temporary override until we release SDK 39 support in Snack!
    if (version === 'v39.0.0') {
      version = 'v38.0.0';
    }

    return version.replace('v', '');
  };

  _getExamplesPath = () => {
    return `${document.location.origin}/static/examples/${this._getSelectedDocsVersion()}`;
  };

  _getDependencies = () => {
    return [...this.props.dependencies].join(',');
  };

  _getCode = () => {
    return this.contentRef.current ? this.contentRef.current.textContent : '';
  };

  render() {
    return (
      <div>
        <div ref={this.contentRef}>{this.props.children}</div>
        <form action={SNACK_URL} method="POST" target="_blank">
          <input
            type="hidden"
            name="platform"
            value={this.props.defaultPlatform || DEFAULT_PLATFORM}
          />
          <input type="hidden" name="name" value={this.props.label || 'Example'} />
          <input type="hidden" name="dependencies" value={this._getDependencies()} />
          <input type="hidden" name="sdkVersion" value={this._getSnackSdkVersion()} />
          {this.state.ready && (
            <input
              type="hidden"
              name="files"
              value={JSON.stringify(
                getSnackFiles({
                  templateId: this.props.templateId,
                  code: this._getCode(),
                  files: this.props.files,
                  baseURL: this._getExamplesPath(),
                })
              )}
            />
          )}
          <button className="snack-inline-example-button" disabled={!this.state.ready}>
            <ExternalLink size={16} /> Try this example on Snack
          </button>
        </form>
      </div>
    );
  }
}
