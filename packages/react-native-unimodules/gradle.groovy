import groovy.json.JsonSlurper

apply from: new File(["node", "--print", "require.resolve('expo-modules-core/package.json')"].execute().text.trim(), "../scripts/autolinking.gradle")

def getProjectPackageJson(File projectRoot) {
  String resolveScript = """
  const findUp = require('find-up');
  console.log(findUp.sync('package.json'));
  """
  String[] nodeCommand = ["node", "-e", resolveScript]
  String packageJsonPath = spawnProcess(nodeCommand, projectRoot)
  def packageJsonFile = new File(packageJsonPath)
  def packageJson = new JsonSlurper().parseText(packageJsonFile.text)
  return packageJson;
}

Map getAndroidConfig(File projectRoot) {
  def packageJson = getProjectPackageJson(projectRoot)
  if (packageJson == null || packageJson["react-native-unimodules"] == null || packageJson["react-native-unimodules"].android == null) {
    return [:]
  }
  return packageJson["react-native-unimodules"].android
}

def spawnProcess(String[] cmd, File directory) {
  try {
    def cmdProcess = Runtime.getRuntime().exec(cmd, null, directory)
    def bufferedReader = new BufferedReader(new InputStreamReader(cmdProcess.getInputStream()))
    def buffered = ""
    def results = new StringBuffer()
    while ((buffered = bufferedReader.readLine()) != null) {
      results.append(buffered)
    }
    return results.toString()
  } catch (Exception exception) {
    rootProject.logger.error "Spawned process '${cmd}' threw an error"
    throw exception
  }
}

class Colors {
  static final String NORMAL = "\u001B[0m"
  static final String GREEN = "\u001B[32m"
  static final String YELLOW = "\u001B[33m"
  static final String BLUE = "\u001B[34m"
}

ext.addUnimodulesDependencies = { Map customOptions = [:] ->
  // no-op, autolinking v2 adds dependencies automatically
}

ext.addMavenUnimodulesDependencies = { Map customOptions = [:] ->
  // no-op, autolinking v2 adds dependencies automatically
}

ext.includeUnimodulesProjects = { Map customOptions = [:] ->
  println '⚠️ ' + Colors.GREEN + 'react-native-unimodules' + Colors.YELLOW + ' is deprecated in favor of ' + Colors.GREEN + 'expo-modules-core' + Colors.NORMAL
  println Colors.YELLOW + '⚠️ Follow this guide to migrate: ' + Colors.BLUE + 'https://expo.fyi/expo-modules-core-migration' + Colors.NORMAL
  println()

  def options = [
      modulesPaths: ['../../node_modules'],
      exclude     : [],
  ] << getAndroidConfig(rootProject.projectDir) << customOptions

  ext.useExpoModules(options)
}
