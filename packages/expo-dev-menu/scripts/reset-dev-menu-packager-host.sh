HOST_FILE='./assets/dev-menu-packager-host'

git update-index --no-skip-worktree $HOST_FILE
git checkout HEAD -- $HOST_FILE

echo "$HOST_FILE was cleared"
