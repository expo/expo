import Typography from 'typography';
import CodePlugin from 'typography-plugin-code';

const typography = new Typography({
  title: 'Expo',
  scaleRatio: 2.5,
  baseLineHeight: 1.45,
  headerFontFamily: ['Source Sans Pro', 'sans-serif'],
  bodyFontFamily: ['Source Sans Pro', 'sans-serif'],
  headerColor: 'hsla(0,0%,0%,0.85)',
  bodyColor: 'hsla(0,0%,0%,0.7)',
  headerWeight: '400',
  bodyWeight: 400,
  boldWeight: 700,
  plugins: [new CodePlugin()],
  overrideStyles: ({ rhythm, scale }) => ({
    '.embedded-example-container': {
      overflow: 'hidden',
      background: '#fafafa',
      border: '1px solid rgba(0,0,0,.16)',
      borderRadius: '4px',
      height: '483px',
      width: '100%',
    },
    'h1,h2,h3,h4,h5.h6': {
      lineHeight: 1.2,
    },
    hr: {
      background: '#eee',
    },
    p: {
      marginBottom: '1rem',
    },
    'h1, h2': {
      borderBottom: `1px solid #efefef`,
      marginBottom: rhythm(3 / 4),
      marginTop: rhythm(1),
      paddingBottom: `calc(${rhythm(1 / 4)} - 1px)`,
    },
    'body h1': {
      marginTop: rhythm(0.7),
      lineHeight: 1.1,
    },
    'tt,code': {
      fontFamily: `"Source Code Pro",Consolas,"Roboto Mono","Droid Sans Mono","Liberation Mono",Menlo,Courier,monospace`,
      paddingTop: `0.05em`,
      paddingBottom: `0.05em`,
      fontSize: '14px',
      fontWeight: 400,
    },
    'li code': {
      fontWeight: 500,
    },
    'p code': {
      fontWeight: 500,
    },
    a: {
      color: `#428bca`,
      textDecoration: `none`,
    },
    'a:hover': {
      textDecoration: `underline`,
    },
    blockquote: {
      borderWidth: `.1em 0 .1em 0`,
      borderColor: `#e5eef2`,
      backgroundColor: `#f3f8f9`,
      marginLeft: 0,
      marginRight: 0,
      padding: rhythm(1),
    },
    'blockquote > pre': {
      background: `none`,
    },
    ul: {
      listStyleType: 'none',
    },
    'ul > li': {
      marginLeft: '-20px',
      paddingLeft: '20px',
    },
    'ul > li:before': {
      marginLeft: '-20px',
      paddingLeft: '20px',
      content: '-',
    },
    'li:hover > a.anchor > svg.anchor-icon': {
      visibility: 'visible',
    },
    'ol > li a.anchor svg.anchor-icon': {
      background: '#fff',
    },
    'li a.anchor svg.anchor-icon': {
      position: 'absolute',
      visibility: 'hidden',
      marginTop: '3px',
    },
    'ol > li': {
      paddingLeft: '3px',
    },
    'ol > li > a.anchor > svg.bullet-icon': {
      visibility: 'hidden !important',
    },
    'ul > li:hover > a.anchor > svg.bullet-icon': {
      visibility: 'hidden',
    },
    'ul > li a.anchor svg.bullet-icon': {
      position: 'absolute',
      visibility: 'visible',
      marginTop: '3px',
    },
    'li > p': {
      marginBottom: rhythm(1 / 2),
    },
    'ul ul': {
      // backgroundColor: '#fafaff',
      paddingBottom: '5px',
      marginLeft: 0,
      borderRadius: '4px',
      // paddingTop: '10px'
    },
    'ul ul > li': {
      marginLeft: 0,
    },
    'h2 code': {
      fontSize: '20px',
    },
    h3: {
      marginTop: '30px',
      marginBottom: '10px',
    },
    'h3 code': {
      backgroundColor: 'hsla(216, 94%, 48%, 0.1)',
      lineHeight: 1.5,
      fontSize: '1rem',
      fontWeight: 500,
    },
    strong: {
      color: `rgba(0,0,0,0.65)`,
    },
    h4: {
      color: `rgba(0,0,0,0.65)`,
      fontWeight: `bold`,
      marginBottom: rhythm(1 / 2),
    },
  }),
});

// Hot reload typography in development.
if (process.env.NODE_ENV !== 'production') {
  typography.injectStyles();
}

export default typography;
