//
//  ManageUsersViewController.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/24/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import ContactsUI
import Foundation
import UIKit


class ManageUsersViewController: UIViewController, CNContactPickerDelegate, UITableViewDataSource, UITableViewDelegate {
    
    @IBOutlet weak var textPhoneNumber: UITextField!
    @IBOutlet weak var textUserName: UITextField!
    @IBOutlet weak var tableViewUsers: UITableView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadUsers()
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func buttonContacts(_ sender: UIButton) {
        let contactPickerViewController = CNContactPickerViewController()
        contactPickerViewController.displayedPropertyKeys = ["phoneNumbers"]
        contactPickerViewController.delegate = self
        present(contactPickerViewController, animated: true, completion: nil)
    }
    
    func contactPicker(_ picker: CNContactPickerViewController, didSelect contactProperty: CNContactProperty) {
        textPhoneNumber.text = stripPhoneNumber(phoneNumber: (contactProperty.value as! CNPhoneNumber).stringValue)
        textUserName.text = contactProperty.contact.givenName
    }
    
    @IBAction func buttonAddUser(_ sender: Any) {
        let phoneNumber = textPhoneNumber.text!
        let userName = textUserName.text!
        
        let dict = ["item_id": g_currentItemId, "phone_number": phoneNumber, "user_name": userName]
        httpRequest(url: "/items_users", method: "POST", body: dict) { json in
            var user = User()
            user.userName = userName
            user.phoneNumber = phoneNumber
            self.users += [user]
            DispatchQueue.main.async {
                self.tableViewUsers.reloadData()
                self.textPhoneNumber.text = ""
                self.textUserName.text = ""
            }
        }
    }
    
    
    struct User {
        var userName = ""
        var phoneNumber = ""
        var phoneNumberOwner = ""
    }
    var users = [User]()
    
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return users.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // Table view cells are reused and should be dequeued using a cell identifier.
        let cellIdentifier = "ManageUsersTableViewCell"
        
        guard let cell = tableView.dequeueReusableCell(withIdentifier: cellIdentifier, for: indexPath) as? ManageUsersTableViewCell  else {
            fatalError("The dequeued cell is not an instance of ManageUsersTableViewCell.")
        }
        
        cell.manageUsersViewController = self
        cell.labelUserName.text = users[indexPath.row].userName
        cell.labelPhoneNumber.text = formatPhoneNumber(phoneNumber: users[indexPath.row].phoneNumber)
        
        // Owner for item cannot be deleted.  Owner needs to delete the item itself
        if users[indexPath.row].phoneNumber == users[indexPath.row].phoneNumberOwner {
            cell.buttonDelete.isHidden = true
        }
        else {
            cell.buttonDelete.isHidden = false
        }
        return cell
    }
    
    private func loadUsers() {
        httpGet(url: "/items_users/" + g_currentItemId) { json in
            self.users = []
            
            let array = json["users"] as! Array<AnyObject>
            for element in array {
                var user = User()
                user.userName = element["user_name"] as! String
                user.phoneNumber = element["phone_number"] as! String
                user.phoneNumberOwner = element["phone_number_owner"] as! String
                self.users += [user]
            }
            DispatchQueue.main.async {
                self.tableViewUsers.reloadData()
            }
        }
    }
}


class ManageUsersTableViewCell: UITableViewCell {
    
    @IBOutlet weak var labelUserName: UILabel!
    @IBOutlet weak var labelPhoneNumber: UILabel!
    @IBOutlet weak var buttonDelete: UIButton!
    
    var manageUsersViewController: ManageUsersViewController!
    
    override func awakeFromNib() {
        super.awakeFromNib()
    }
    
    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)
    }
    
    @IBAction func buttonDelete(_ sender: UIButton) {
        let phoneNumber = stripPhoneNumber(phoneNumber: labelPhoneNumber.text!)
        httpRequest(url: "/items_users/" + g_currentItemId + "/" + phoneNumber, method: "DELETE") { json in
            let indexPath = self.manageUsersViewController.tableViewUsers.indexPath(for: self)
            
            self.manageUsersViewController.users.remove(at: (indexPath?.row)!)
            DispatchQueue.main.async {
                self.manageUsersViewController.tableViewUsers.deleteRows(at: [indexPath!], with: UITableViewRowAnimation.fade)
            }
        }
    }
}

