import React from 'react';
import Link from 'gatsby-link';
import { rhythm } from 'utils/typography';
import presets from 'glamor-media-query-presets';

class Sidebar extends React.Component {
  render() {
    const {
      activeRoutes,
      id,
      router,
      activeVersion,
      versions,
      setVersion,
      ...otherProps
    } = this.props;

    const Header = ({ i, link, children }) => (
      <h3
        css={{
          color: `rgb(136, 136, 136)`,
          textTransform: 'uppercase',
          fontSize: 15,
          fontWeight: `normal`,
          marginBottom: rhythm(1 / 2),
          marginTop: i === 0 ? 0 : rhythm(1.25), // Except for the first header
        }}>
        <Link
          activeClassName="current"
          css={{ color: 'inherit' }}
          activeStyle={{
            color: `rgba(0,0,0,0.40)`,
          }}
          to={link}>
          {children}
        </Link>
      </h3>
    );

    const List = ({ children }) => (
      <ul
        css={{
          listStyle: `none`,
          marginBottom: 0,
          marginLeft: 0,
        }}>
        {children}
      </ul>
    );

    const SidebarLink = props => (
      <Link
        {...props}
        activeClassName="current"
        activeStyle={{
          color: `rgba(0,0,0,0.40)`,
        }}
        css={{
          color: `inherit`,
        }}
      />
    );

    return (
      <div {...otherProps}>
        <div
          id={id}
          css={{
            background: `white`,
            padding: rhythm(1),
            paddingRight: `calc(${rhythm(1)} - 1px)`,
            [presets.Tablet]: {
              paddingTop: rhythm(1),
              paddingBottom: rhythm(1),
              paddingLeft: 0, // For desktop, let main wrapper take care
              // of padding on left.
            },
          }}>
          {/* Show the version switcher on mobile */}
          <select
            value={this.props.activeVersion}
            onChange={e => this.props.setVersion(e.target.value)}
            css={{
              border: `none`,
              background: `none`,
              borderRadius: 0,
              cursor: `pointer`,
              outline: `none`,
              fontSize: `100%`,
              marginBottom: rhythm(1),
              marginLeft: 0,
              [presets.Tablet]: {
                display: `none`,
              },
            }}>
            {this.props.versions.map(version => {
              return (
                <option key={version} value={version}>
                  SDK Version {version}
                </option>
              );
            })}
          </select>

          {activeRoutes.map((section, i) => {
            return (
              <div key={section.title}>
                <Header i={i} link={section.index}>
                  {section.title}
                </Header>
                <List>
                  {Object.keys(section.links).map(title => (
                    <li key={title} css={{ marginBottom: 7 }}>
                      <SidebarLink to={section.links[title]}>
                        {/* Needed for search */}
                        <span css={{ display: 'none' }}>{section.title}</span>
                        {title}
                      </SidebarLink>
                    </li>
                  ))}
                </List>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Sidebar;
