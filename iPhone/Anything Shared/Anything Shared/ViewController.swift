//
//  ViewController.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/22/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import UIKit

class ViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, UIPickerViewDataSource, UIPickerViewDelegate {

    @IBOutlet weak var tableViewItems: UITableView!
    @IBOutlet weak var textName: UITextField!
    @IBOutlet weak var textServer: UITextField!
    @IBOutlet weak var pickerUser: UIPickerView!
    
    struct Item {
        var itemId = ""
        var name = ""
        var phoneNumberOwner = ""
    }
    var items = [Item]()

    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Ask for access to contacts
        requestAccessToContacts()
        
        g_userName = UserDefaults.standard.object(forKey: "UserName") as? String
        g_phoneNumber = UserDefaults.standard.object(forKey: "PhoneNumber") as? String
        if g_userName == nil {
            DispatchQueue.main.async {
                self.performSegue(withIdentifier: "segueRegistration", sender: nil)
            }
        }
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if g_userName != nil {
            loadItems()
            loadUsers()
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return items.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // Table view cells are reused and should be dequeued using a cell identifier.
        let cellIdentifier = "ItemsTableViewCell"
        guard let cell = tableView.dequeueReusableCell(withIdentifier: cellIdentifier, for: indexPath) as? ItemsTableViewCell  else {
            fatalError("The dequeued cell is not an instance of ItemsTableViewCell.")
        }
        
        cell.viewController = self
        cell.itemId = items[indexPath.row].itemId
        cell.buttonName.setTitle(items[indexPath.row].name, for: .normal)
        if g_phoneNumber != nil  &&  g_phoneNumber == items[indexPath.row].phoneNumberOwner {
            cell.labelOwner.isHidden = false
            cell.buttonDelete.isHidden = false
        }
        else {
            cell.labelOwner.isHidden = true
            cell.buttonDelete.isHidden = true
        }
        return cell
    }
    
    private func loadItems() {
        httpGet(url: "/items/" + g_phoneNumber) { json in
            self.items = []
            
            let array = json["items"] as! Array<AnyObject>
            for element in array {
                var item = Item()
                item.itemId = element["item_id"] as! String
                item.name = element["name"] as! String
                item.phoneNumberOwner = element["phone_number_owner"] as! String
                self.items += [item]
            }
            DispatchQueue.main.async {
                self.tableViewItems.reloadData()
                if self.items.count == 0 {
                    showMessage(viewController: self, title: "Getting started", message: "Start by creating a new item.  Once created you can then add friends via Manage Users", autoClose: false)
                }
            }
        }
    }
    
    @IBAction func buttonAddItem(_ sender: UIButton) {
        if textName.text == "" {
            return
        }
        let dict = ["name": textName.text, "phone_number_owner": g_phoneNumber]
        httpRequest(url: "/items", method: "POST", body: dict) { json in
            DispatchQueue.main.async {
                self.textName.text = ""
            }
            self.loadItems()
        }
    }
    
    @IBAction func buttonSetServer(_ sender: UIButton) {
        if textServer.text == "" {
            return
        }
        g_server = textServer.text!
        if g_userName != nil {
            loadItems()
            loadUsers()
        }
    }
    
    struct User {
        var userName = ""
        var phoneNumber = ""
    }
    var users = [User]()

    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }
    
    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return users.count;
    }
    
    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        return users[row].userName + "  " + formatPhoneNumber(phoneNumber: users[row].phoneNumber)
    }
    
    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        if users[row].userName == "-- RESET --" {
            UserDefaults.standard.set(nil, forKey: "UserName")
            UserDefaults.standard.set(nil, forKey: "PhoneNumber")
            showMessage(viewController: self, title: "Reset", message: "Reminder:  You must restart now to take effect", autoClose: false)
        }
        else {
            UserDefaults.standard.set(users[row].userName, forKey: "UserName")
            UserDefaults.standard.set(users[row].phoneNumber, forKey: "PhoneNumber")
            g_userName = users[row].userName
            g_phoneNumber = users[row].phoneNumber
            loadItems()
        }
    }
    
    func loadUsers() {
        if g_userName == nil {
            return
        }
        
        httpGet(url: "/users") { json in
            self.users = []
            
            var user = User()
            user.userName = "-- RESET --"
            user.phoneNumber = ""
            self.users += [user]
            
            var iCurrentUser = 0
            let array = json["users"] as! Array<AnyObject>
            for element in array {
                user = User()
                user.userName = element["user_name"] as! String
                user.phoneNumber = element["phone_number"] as! String
                self.users += [user]
                
                if user.userName == g_userName  &&  user.phoneNumber == g_phoneNumber {
                    iCurrentUser = self.users.count - 1
                }
            }
            DispatchQueue.main.async {
                self.pickerUser.reloadAllComponents()
                self.pickerUser.selectRow(iCurrentUser, inComponent: 0, animated: false)
            }
        }
    }
}


class ItemsTableViewCell: UITableViewCell {
    
    @IBOutlet weak var buttonName: UIButton!
    @IBOutlet weak var labelOwner: UILabel!
    @IBOutlet weak var buttonDelete: UIButton!
    
    var itemId: String!
    var viewController: ViewController!
    
    override func awakeFromNib() {
        super.awakeFromNib()
    }
    
    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)
    }
    
    @IBAction func buttonName(_ sender: UIButton) {
        g_currentItemId = itemId
        g_currentItemName = buttonName.title(for: .normal)
        DispatchQueue.main.async {
            self.viewController.performSegue(withIdentifier: "segueItem", sender: nil)
        }
    }
    
    @IBAction func buttonDelete(_ sender: UIButton) {
        // TODO - add a confirmation dialog here
        
        httpRequest(url: "/items/" + itemId, method: "DELETE") { json in
            let indexPath = self.viewController.tableViewItems.indexPath(for: self)
            
            self.viewController.items.remove(at: (indexPath?.row)!)
            DispatchQueue.main.async {
                self.viewController.tableViewItems.deleteRows(at: [indexPath!], with: UITableViewRowAnimation.fade)
            }
        }
    }
}




