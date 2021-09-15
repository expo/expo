// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class EXDevLauncherErrorLogViewController: UIViewController, UITableViewDataSource, EXDevLauncherErrorManagerListener {
  internal weak var manager: EXDevLauncherErrorManager?
  private var currentData: [String]?
  
  @IBOutlet weak var tableView: UITableView!
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    manager?.addOnNewErrorListener(self)
    currentData = manager?.getErrors()
    tableView?.dataSource = self
    tableView?.tableFooterView = UIView()
  }
  
  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    
    manager?.removeOnNewErrorListener(self)
  }
  
  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    self.navigationController?.setNavigationBarHidden(false, animated: animated)
  }

  func onNewError() {
    tableView?.reloadData()
  }
  
  internal func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return currentData?.count ?? 0
  }
  
  internal func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    guard let data = currentData?[indexPath.item] else {
      let defaultCell = UITableViewCell()
      defaultCell.textLabel?.text = "Unknown Error"
      return defaultCell
    }
    
    let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! EXDevLauncherErrorLogView
    
    let date = Date()
    let df = DateFormatter()
    df.dateFormat = "HH:mm:ss"
    
    cell.title.text = data
    cell.data.text = df.string(from: date)

    return cell
  }
}


