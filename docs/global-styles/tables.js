import * as Constants from '~/common/constants';

export const globalTables = `
  table {
    margin-bottom: 1rem;
    font-size: 0.8rem;
    line-height: 1.2rem;
    border-collapse: collapse;
    border: 1px solid ${Constants.expoColors.gray[250]};
    border-radius: 4px;
    width: 100%;
  }

  thead {
    border-radius: 4px 4px 0 0;
    text-align: left;
  }

  td, th {
    padding: 16px;
    border-bottom: 1px solid ${Constants.expoColors.gray[250]};
    border-right: 1px solid ${Constants.expoColors.gray[250]};

    :last-child {
      border-right: 0px;
    }
  }

  td {
    text-align: left;
  }

  th {
    font-family: ${Constants.fontFamilies.bold};
    font-weight: 400;
  }
`;
