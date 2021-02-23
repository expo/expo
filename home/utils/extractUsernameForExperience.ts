const extractUsernameForExperience = (manifestUrl: string) => {
  if (!manifestUrl) {
    return undefined;
  }
  const username = manifestUrl.match(/@.*?\//)[0];
  if (!username) {
    return undefined;
  } else {
    return username.slice(1, username.length - 1);
  }
};

export default extractUsernameForExperience;
