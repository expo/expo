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
import { presets } from 'glamor';
import Helmet from 'react-helmet';
import ArrowIcon from 'react-icons/lib/md/keyboard-arrow-down';
import logoText from 'images/logo-text.png';

// Load our typefaces
import 'typeface-source-sans-pro';
import 'typeface-source-code-pro';

import v14 from 'data/v14.yaml';
import v13 from 'data/v13.yaml';
import v12 from 'data/v12.yaml';
import v11 from 'data/v11.yaml';
import v10 from 'data/v10.yaml';
import v9 from 'data/v9.yaml';

const versions = [
  `v14.0.0`,
  `v13.0.0`,
  `v12.0.0`,
  `v11.0.0`,
  `v10.0.0`,
  `v9.0.0`
];

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
      activeRoutes: this.getRoutes(version)
    };
  }

  componentDidMount() {
    // Create references to html/body elements
    this.htmlElement = document.querySelector('html');
    this.bodyElement = document.querySelector('body');
  }

  getRoutes = version => {
    let routes;
    switch (version) {
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
        routes = v14;
    }
    return routes;
  };

  setVersion = version => {
    this.setState({
      activeVersion: version,
      activeRoutes: this.getRoutes(version)
    });

    const newRoute = `/versions/${version}`;
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
          title={`Exponent ${this.state.activeVersion} documentation`}
          titleTemplate={
            `%s | Exponent ${this.state.activeVersion} documentation`
          }
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
                padding: rhythm(2),
                paddingTop: rhythm(3)
              }
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
                width: rhythm(9),
                [presets.Tablet]: {
                  display: `block`,
                  position: `fixed`,
                  height: `calc(100vh - 58px)`, // 58px is fixed height of header.
                  overflow: `scroll`
                },
                [presets.Desktop]: {
                  width: rhythm(10)
                },
                [presets.Hd]: {
                  width: rhythm(12)
                }
              }}
            />
            <div
              id="content"
              css={{
                paddingLeft: 0,
                [presets.Tablet]: {
                  display: `block`,
                  paddingLeft: rhythm(10)
                },
                [presets.Desktop]: {
                  paddingLeft: rhythm(12)
                },
                [presets.Hd]: {
                  paddingLeft: rhythm(14)
                }
              }}>
              {this.props.children}
              <p
                css={{
                  textAlign: `center`,
                  marginBottom: rhythm(1 / 2)
                }}>
                © Copyright{' '}
                {new Date().getFullYear()}
                , Exponent.
              </p>
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
            height: `calc(${rhythm(2)} - 1px)`,
            borderBottom: `1px solid #ccc`,
            [presets.Tablet]: {
              display: `none`
            }
          }}>
          <div
            onClick={() =>
              this.setState({ sidebarOpen: !this.state.sidebarOpen })}
            css={{
              float: `left`,
              paddingLeft: rhythm(1 / 3),
              paddingRight: rhythm(1)
            }}>
            <MenuIcon
              css={{
                fontSize: rhythm(5 / 3),
                height: rhythm(2)
              }}
            />
          </div>
          <Link to={`/${this.state.activeVersion}/`}>
            <img
              src={logoText}
              css={{
                marginBottom: rhythm(0),
                marginTop: `0.8rem`,
                maxHeight: rhythm(1)
                //verticalAlign: `middle`,
              }}
            />
          </Link>
        </nav>
      </div>
    );
  }
}

export default withRouter(Wrapper);
