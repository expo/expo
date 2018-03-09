import React from 'react';
import PermalinkIcon from '~/components/icons/permalink-icon';
import BulletIcon from '~/components/icons/bullet-icon';
import generateSlug from '~/components/base/generate-slug';

export const UL = ({ children }) => (
  <ul>
    {children}
    <style jsx>
      {`
        ul {
          padding: 0;
          margin-left: 15px;
          margin-top: 20px;
          list-style-image: none;
          list-style-type: none;
        }
      `}
    </style>
  </ul>
);

export const OL = ({ children }) => (
  <ol>
    {children}
    <style jsx global>
      {`
        ol {
          padding-left: 0;
          margin-left: 15px;
          margin-top: 20px;
          list-style-position: outside;
          list-style-image: none;
        }
      `}
    </style>
  </ol>
);

export const LI = ({ id, children }) => {
  if (id == null) {
    id = generateSlug(children);
  }

  return (
    <div style={{ position: 'relative' }}>
      <li>
        <span id={id} className="target" />
        <a href={'#' + id} className="anchor">
          <BulletIcon />
          <PermalinkIcon />
        </a>
        <p>{children}</p>
        <style jsx>
          {`

            a.anchor {
              width: 20px;
              height: 20px;
            }

            .permalink {
              text-align: center;
              vertical-align: middle;
              visibility: hidden;
            }

            .target {
              display: block;
              position: absolute
              top: -100px;
              visibility: hidden;
            }
          `}
        </style>
      </li>
    </div>
  );
};
