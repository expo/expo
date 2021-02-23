const extractUsernameForExperience = (manifestUrl: any) => {
  if (typeof manifestUrl === 'string') {
    //@ts-ignore manifestUrl cannot be null here
    const username = manifestUrl.match(/@.*?\//)[0];
    if (!username) {
      return undefined;
    } else {
      return username.slice(1, username.length - 1);
    }
  }
  return undefined;
};

export default extractUsernameForExperience;
