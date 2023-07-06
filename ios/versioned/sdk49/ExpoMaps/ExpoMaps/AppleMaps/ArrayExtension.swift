extension Array {
  func penultimate() -> Element? {
      if count < 2 {
          return nil
      }
      let index = count - 2
      return self[index]
  }
}
