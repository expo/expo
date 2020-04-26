import * as React from 'react';
import { css } from 'react-emotion';

const STYLES_LINK = css`
  text-decoration: none;
  transition: box-shadow 0.15s ease 0s, transform 0.15s ease 0s, -webkit-box-shadow 0.15s ease 0s,
    -webkit-transform 0.15s ease 0s;
  box-shadow: rgba(2, 8, 20, 0.1) 0px 0.175em 0.5em, rgba(2, 8, 20, 0.08) 0px 0.085em 0.175em;
  :hover {
    box-shadow: rgba(2, 8, 20, 0.1) 0px 0.35em 1.175em, rgba(2, 8, 20, 0.08) 0px 0.175em 0.5em;
    transform: scale(1.05);
  }
`;

export function CreateAppButton({ href, name }) {
  return (
    <a className="snack-inline-example-button" href={href}>
      Create {name} App
    </a>
  );
}

export function SocialGrid({ children }) {
  return (
    <div
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gridTemplateRows: '1fr',
        display: 'grid',
        gap: '1.35rem',
      }}>
      {children}
    </div>
  );
}

export function SocialGridItem({ title, image, href }) {
  return (
    <a
      href={href}
      className={STYLES_LINK}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.65em 2em',
        gap: '1.35rem',
        textDecoration: 'none',
      }}>
      <img
        style={{
          transitionProperty: 'all',
          transitionDuration: '0.15s',
          width: 56,
          height: 56,
          marginBottom: '1.2em',
        }}
        src={image}
      />
      <p
        style={{
          color: '#020814',
          fontSize: '1.2em',
          fontWeight: '900',
        }}>
        {title}
      </p>
    </a>
  );
}
