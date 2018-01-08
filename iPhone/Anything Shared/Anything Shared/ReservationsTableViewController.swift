//
//  ReservationsTableViewController.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/22/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import Foundation
import UIKit


class ReservationsTableViewController: UITableViewController {
    
    struct Reservation {
        var date = ""
        var phoneNumber = ""
        var userName = ""
    }
    var reservations = [Reservation]()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadReservations()
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    override func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return reservations.count
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // Table view cells are reused and should be dequeued using a cell identifier.
        let cellIdentifier = "ReservationTableViewCell"
        guard let cell = tableView.dequeueReusableCell(withIdentifier: cellIdentifier, for: indexPath) as? ReservationTableViewCell  else {
            fatalError("The dequeued cell is not an instance of ReservationTableViewCell.")
        }
        
        cell.reservationsTableViewController = self
        cell.labelDate.text = reservations[indexPath.row].date
        cell.labelUserName.text = reservations[indexPath.row].userName
        
        // TODO - need to do something with phone_number here.  Ideally link to contact
        
        if reservations[indexPath.row].phoneNumber != g_phoneNumber {
            cell.buttonDelete.isHidden = true
        }
        else {
            cell.buttonDelete.isHidden = false
        }
        return cell
    }
    
    public func loadReservations() {
        httpGet(url: "/reservations/" + g_currentItemId) { json in
            self.reservations = []
            
            let array = json["reservations"] as! Array<AnyObject>
            for element in array {
                var reservation = Reservation()
                reservation.date = element["date"] as! String
                reservation.phoneNumber = element["phone_number"] as! String
                reservation.userName = element["user_name"] as! String
                self.reservations += [reservation]
            }
            DispatchQueue.main.async {
                self.tableView.reloadData()
            }
        }
    }
}


class ReservationTableViewCell: UITableViewCell {
    
    @IBOutlet weak var labelDate: UILabel!
    @IBOutlet weak var labelUserName: UILabel!
    @IBOutlet weak var buttonDelete: UIButton!
    
    var reservationsTableViewController: ReservationsTableViewController!
    
    override func awakeFromNib() {
        super.awakeFromNib()
    }
    
    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)
    }
    
    @IBAction func buttonDelete(_ sender: Any) {
        httpRequest(url: "/reservations/" + g_currentItemId + "/" + labelDate.text!, method: "DELETE") { json in
            DispatchQueue.main.async {
                let tableViewController = self.reservationsTableViewController
                let indexPath = tableViewController?.tableView.indexPath(for: self)
                tableViewController?.reservations.remove(at: (indexPath?.row)!)
                tableViewController?.tableView.deleteRows(at: [indexPath!], with: UITableViewRowAnimation.fade)
            }
        }
    }
}



