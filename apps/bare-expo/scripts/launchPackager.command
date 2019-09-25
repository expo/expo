THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
cd "$THIS_DIR/../" && react-native start --config "metro.config.js"

