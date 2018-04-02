import * as Constants from '~/common/constants';

export const globalTables = `
  table {
    margin-bottom: 1rem;
    font-size: 1rem;
    line-height: 1.45rem;
    border-collapse: collapse;
    border: 1px solid hsla(0,0%,0%,0.12);
    width: 100%;
  }

  thead {
    text-align: left;
  }

  th, td {
    text-align: left;
    border-bottom: 1px solid hsla(0,0%,0%,0.12);
    font-feature-settings: "tnum";
    -moz-font-feature-settings: "tnum";
    -ms-font-feature-settings: "tnum";
    -webkit-font-feature-settings: "tnum";
    padding-left: 0.96667rem;
    padding-right: 0.96667rem;
    padding-top: 0.725rem;
    padding-bottom: calc(0.725rem - 1px);
  }

  th {
    font-weight: bold;
  }
`.replace(/\s/g, '');
