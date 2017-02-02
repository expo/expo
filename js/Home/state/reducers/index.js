import ApolloClient from '../../api/ApolloClient';
import authTokensReducer from './authTokensReducer';

export default {
  authTokens: authTokensReducer,
  apollo: ApolloClient.reducer(),
}
