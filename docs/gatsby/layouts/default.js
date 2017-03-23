/**
 * @flow
 */

import React from 'react';
import Link from 'gatsby-link';
import { withRouter } from 'react-router';
import Drawer from 'react-motion-drawer';
import SidebarContent from 'components/sidebar';
import Header from 'components/header';
import typography from 'utils/typography';
const rhythm = typography.rhythm;
const scale = typography.scale;
import 'css/prism-coy.css';
import { ScrollContainer } from 'react-router-scroll';
import MenuIcon from 'react-icons/lib/md/menu';
import presets from 'glamor-media-query-presets';
import Helmet from 'react-helmet';
import ArrowIcon from 'react-icons/lib/md/keyboard-arrow-down';
import logoText from 'images/logo-text.svg';

// Load our typefaces
import 'typeface-source-sans-pro';
import 'typeface-source-code-pro';

import unversioned from 'data/unversioned.yaml';
import v15 from 'data/v15.yaml';
import v14 from 'data/v14.yaml';
import v13 from 'data/v13.yaml';
import v12 from 'data/v12.yaml';
import v11 from 'data/v11.yaml';
import v10 from 'data/v10.yaml';
import v9 from 'data/v9.yaml';

const versions = [
  // `unversioned`,
  `v15.0.0`,
  `v14.0.0`,
  `v13.0.0`,
  `v12.0.0`,
  `v11.0.0`,
  `v10.0.0`,
  `v9.0.0`,
];

// NOTE(brentvatne): super ugly hack because navbar depends on us adding
// padding to the entire document which then breaks the regular anchor
// behaviour
function offsetAnchor() {
  if (location.hash.length !== 0) {
    window.scrollTo(window.scrollX, window.scrollY - 70);
  }
}

class Wrapper extends React.Component {
  constructor(props) {
    super();
    let version = props.location.pathname.split(`/`)[2];
    if (!version || versions.indexOf(version) === -1) {
      version = versions[0];
    }
    this.state = {
      sidebarOpen: false,
      activeVersion: version,
      activeRoutes: this.getRoutes(version),
    };
  }

  componentDidMount() {
    // Create references to html/body elements
    this.htmlElement = document.querySelector('html');
    this.bodyElement = document.querySelector('body');

    // This will capture hash changes while on the page
    window.addEventListener('hashchange', offsetAnchor);
  }

  getRoutes = version => {
    let routes;
    switch (version) {
      // case 'unversioned':
      //   routes = unversioned;
      //   break;
      case 'v15.0.0':
        routes = v15;
        break;
      case 'v14.0.0':
        routes = v14;
        break;
      case 'v13.0.0':
        routes = v13;
        break;
      case 'v12.0.0':
        routes = v12;
        break;
      case 'v11.0.0':
        routes = v11;
        break;
      case 'v10.0.0':
        routes = v10;
        break;
      case 'v9.0.0':
        routes = v9;
        break;
      default:
        routes = v15;
    }
    return routes;
  };

  setVersion = version => {
    this.setState({
      activeVersion: version,
      activeRoutes: this.getRoutes(version),
    });

    const newRoute = `/versions/${version}/index.html`;
    this.props.router.push(newRoute);
  };

  render() {
    // Freeze the background when the overlay is open.
    if (this.htmlElement && this.bodyElement) {
      if (this.state.sidebarOpen) {
        this.htmlElement.style.overflow = 'hidden';
        this.bodyElement.style.overflow = 'hidden';
      } else {
        this.htmlElement.style.overflow = 'visible';
        this.bodyElement.style.overflow = 'visible';
      }
    }

    return (
      <div>
        <Helmet
          title={`Expo ${this.state.activeVersion} documentation`}
          titleTemplate={`%s | Expo ${this.state.activeVersion} documentation`}
        />

        <Drawer
          open={this.state.sidebarOpen}
          onChange={open => this.setState({ sidebarOpen: open })}>
          <div onClick={() => this.setState({ sidebarOpen: false })}>
            <SidebarContent
              id="mobile-sidebar"
              activeRoutes={this.state.activeRoutes}
              activeVersion={this.state.activeVersion}
              versions={versions}
              setVersion={this.setVersion}
            />
          </div>
        </Drawer>

        <Header
          activeVersion={this.state.activeVersion}
          versions={versions}
          router={this.props.router}
          setVersion={this.setVersion}
        />

        <ScrollContainer scrollKey={`main content`}>
          <div
            css={{
              height: `100%`,
              overflow: `auto`,
              margin: `0 auto`,
              maxWidth: 1280,
              padding: rhythm(3 / 4),
              paddingTop: rhythm(2), // extra padding for top navbar on mobile
              [presets.Tablet]: {
                padding: rhythm(1),
                paddingTop: rhythm(2.5),
                paddingRight: rhythm(2.5),
              },
            }}>
            <SidebarContent
              id="sidebar"
              activeRoutes={this.state.activeRoutes}
              activeVersion={this.state.activeVersion}
              versions={versions}
              setVersion={this.setVersion}
              css={{
                display: `none`, // Hidden on mobile.
                float: `left`,
                height: `100%`,
                width: rhythm(10.25),
                borderRight: '1px solid #eee',
                [presets.Tablet]: {
                  display: `block`,
                  position: `fixed`,
                  height: `calc(100vh - 58px)`, // 58px is fixed height of header.
                  overflow: `scroll`,
                },
              }}
            />
            <div
              id="content"
              css={{
                paddingLeft: 0,
                [presets.Tablet]: {
                  display: `block`,
                  paddingLeft: rhythm(11.7),
                },
              }}>
              {this.props.children}
            </div>
          </div>
        </ScrollContainer>
        <nav
          css={{
            display: `block`,
            background: `white`,
            position: 'fixed',
            right: 0,
            top: 0,
            left: 0,
            zIndex: 1001,
            height: `calc(${rhythm(2)} - 1px)`,
            borderBottom: `1px solid #ccc`,
            [presets.Tablet]: {
              display: `none`,
            },
          }}>
          <div
            onClick={() =>
              this.setState({ sidebarOpen: !this.state.sidebarOpen })}
            css={{
              float: `left`,
              paddingLeft: rhythm(1 / 3),
              paddingRight: 12,
              paddingTop: 8,
            }}>
            <MenuIcon
              css={{
                fontSize: rhythm(5 / 3),
                height: rhythm(1.25),
              }}
            />
          </div>
          <Link to={`/versions/${this.state.activeVersion}/index.html`}>
            <img
              src={logoText}
              css={{
                marginBottom: rhythm(0),
                marginTop: 15,
                maxHeight: rhythm(1),
                width: 100,
              }}
            />
          </Link>
        </nav>
      </div>
    );
  }
}
export default withRouter(Wrapper);
