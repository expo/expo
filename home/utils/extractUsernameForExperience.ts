const extractUsernameForExperience = (manifestUrl: string) => {
  const username = manifestUrl.match(/@.*?\//)[0];
  if (!username) {
    return null;
  } else {
    return username.slice(1, username.length - 1);
  }
};

export default extractUsernameForExperience;
