workflow "Run main" {
  on = "push"
  resolves = ["Say hi"]
}

action "Say hi" {
  runs = "echo 'hi;"
}
