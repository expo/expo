import * as React from 'react';
import DocumentationPageContext from '~/components/DocumentationPageContext';

const DEFAULT_PLATFORM = 'android';
const DEFAULT_DEPS = {
  'v35.0.0': [
    // NOTE(brentvatne): we can express default dependencies to include
    // in every Snack here, for example for React Navigation we would do this:
    // 'react-navigation@^4.0.10',
    // 'react-navigation-tabs@^2.5.6',
    // 'react-navigation-stack@^1.10.3',
    // 'react-navigation-drawer@^2.3.3',
  ],
};

export default class SnackInline extends React.Component {
  static contextType = DocumentationPageContext;
  contentRef = React.createRef();
  formRef = React.createRef();

  static defaultProps = {
    dependencies: [],
  };

  state = {
    showLink: false,
  };

  componentDidMount() {
    // render it only on the client side
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ showLink: true });
  }

  _getDependencies = () => {
    let dependencies = [...DEFAULT_DEPS[this.context.version], ...this.props.dependencies];
    return dependencies.join(',');
  };

  _getSnackUrl = () => {
    let currentVersion = this.context.version;
    let label = this.props.label;
    let templateId = this.props.templateId;

    let baseUrl =
      `https://snack.expo.io?platform=${DEFAULT_PLATFORM}&name=` +
      encodeURIComponent(label) +
      '&dependencies=' +
      encodeURIComponent(this._getDependencies());

    if (templateId) {
      let templateUrl = `${document.location.origin}/static/examples/${currentVersion}/${templateId}.js`;
      return `${baseUrl}&sourceUrl=${encodeURIComponent(templateUrl)}`;
    } else {
      return `${baseUrl}&code=${encodeURIComponent(this._getCode())}`;
    }
  };

  _getCode = () => {
    if (this.contentRef.current) {
      return this.contentRef.current.textContent;
    } else {
      return '';
    }
  };

  render() {
    if (this.props.templateId) {
      return (
        <div>
          <div ref={this.contentRef}>{this.props.children}</div>
          {this.state.showLink ? (
            <a className="snack-inline-example-button" href={this._getSnackUrl()} target="_blank">
              Try this example on Snack <OpenIcon />
            </a>
          ) : null}
        </div>
      );
    } else {
      return (
        <div>
          <div ref={this.contentRef}>{this.props.children}</div>

          {/* TODO: this should be a POST request, need to change Snack to support it though */}
          <form ref={this.formRef} action="https://snack.expo.io" method="GET" target="_blank">
            <input type="hidden" name="platform" value={DEFAULT_PLATFORM} />
            <input type="hidden" name="name" value={this.props.label || 'Example'} />
            <input type="hidden" name="dependencies" value={this._getDependencies()} />
            <input type="hidden" name="code" value={this._getCode()} />

            <button className="snack-inline-example-button">
              Try this example on Snack <OpenIcon />
            </button>
          </form>
        </div>
      );
    }
  }
}

const OpenIcon = props => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    style={{
      marginLeft: '5px',
      verticalAlign: '-1px',
    }}
    {...props}>
    <g fill="none" stroke="currentColor">
      <path d="M8.5.5h7v7M8 8L15.071.929M9.07 3.5H1.5v11h11V6.93" />
    </g>
  </svg>
);
