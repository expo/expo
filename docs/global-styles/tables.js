import * as Constants from '~/constants/theme';

export const globalTables = `
  table {
    margin-bottom: 1rem;
    font-size: 0.8rem;
    border-collapse: collapse;
    border: 1px solid ${Constants.expoColors.gray[250]};
    border-radius: 4px;
    width: 100%;
  }

  thead {
    border-radius: 4px;
    text-align: left;
    background: ${Constants.expoColors.gray[100]};
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
