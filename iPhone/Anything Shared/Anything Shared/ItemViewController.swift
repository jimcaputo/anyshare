//
//  ItemViewController.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/22/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import Foundation
import UIKit

class ItemViewController: UIViewController {
    
    @IBOutlet weak var labelStatus: UILabel!
    @IBOutlet weak var buttonActivate: UIButton!
    @IBOutlet weak var buttonDeactivate: UIButton!
    @IBOutlet weak var datePicker: UIDatePicker!
    @IBOutlet weak var stepperDuration: UIStepper!
    @IBOutlet weak var textDuration: UITextField!
    @IBOutlet weak var labelAvailability: UILabel!
    @IBOutlet weak var buttonReserve: UIButton!
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        navigationItem.title = g_currentItemName
        
        // Advance date by 1 day, since you can only reserve in the future
        datePicker.date.addTimeInterval(24 * 60 * 60)
        datePicker.minimumDate = datePicker.date

        // Get the current status
        httpGet(url: "/status/" + g_currentItemId)  { json in
            self.updateStatus(json: json, showAlert: false)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    private func updateStatus(json: Dictionary<String, AnyObject>, showAlert: Bool) {
        let json = json["status"]
        let active = json?["active"] as! String
        let userName = json?["user_name"] as! String?
        var status = ""
        
        // TODO - need to do something with phone_number here.  Ideally link to contact.  (also, see TODO below)
        if active == "true" {
            status = "Active - " + userName!
        }
        else {
            status = "Inactive"
        }
        
        DispatchQueue.main.async {
            self.labelStatus.text = status
            if active == "true" {
                self.buttonActivate.isEnabled = false
                self.buttonDeactivate.isEnabled = true
                
                if showAlert == true {
                    showMessage(viewController: self, title: "Activated!", message: "Auto-expires in 24 hours", autoClose: true)
                }
            }
            else {
                self.buttonActivate.isEnabled = true
                self.buttonDeactivate.isEnabled = false
            }
        }
    }
    
    @IBAction func buttonActivate(_ sender: UIButton) {
        let dict = ["item_id": g_currentItemId, "active": "true", "phone_number": g_phoneNumber]
        httpRequest(url: "/status", method: "POST", body: dict) { json in
            let status = ["status": ["active": "true", "user_name": g_userName, "phone_number": g_phoneNumber]]
            self.updateStatus(json: status as Dictionary<String, AnyObject>, showAlert: true)
        }
    }
    
    @IBAction func buttonDeactivate(_ sender: UIButton) {
        // TODO - fix this.  Needs to key off of phone_number somehow
        if self.labelStatus.text?.range(of: g_userName) == nil {
            showMessage(viewController: self, title: "Sorry, not possible", message: "Only the active user can deactivate", autoClose: false)
        }
        else {
            let dict = ["item_id": g_currentItemId, "active": "false", "phone_number": ""]
            httpRequest(url: "/status", method: "POST", body: dict) { json in
                let status = ["status": ["active": "false", "user_name": "", "phone_number": ""]]
                self.updateStatus(json: status as Dictionary<String, AnyObject>, showAlert: true)
            }
        }
    }
    
    private func checkAvailability() {
        let dateStart = datePicker.date
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let days = Double(self.textDuration.text!)
        var dateEnd = dateStart
        // Calculate the end date for the reservation.  We subtract 1 because if only 1 day, the text should
        // read:  "Apr 1 - Apr 1"  Then multiply to get the number of seconds.
        dateEnd.addTimeInterval((days! - 1) * 24.0 * 60.0 * 60.0)
        
        var dateStartString = dateFormatter.string(from: dateStart)
        var dateEndString = dateFormatter.string(from: dateEnd)
        
        httpGet(url: "/availability/" + dateStartString + "/" + dateEndString) { json in
            dateFormatter.dateFormat = "E, MMM d"
            dateStartString = dateFormatter.string(from: dateStart)
            dateEndString = dateFormatter.string(from: dateEnd)
            var availability = dateStartString + " - " + dateEndString + ":  "
            
            DispatchQueue.main.async {
                if json["availability"] as! String == "true" {
                    availability += "AVAILABLE"
                    self.buttonReserve.isEnabled = true
                }
                else {
                    availability += "UNAVAILABLE"
                    self.buttonReserve.isEnabled = false
                }
                self.labelAvailability.text = availability
            }
        }
    }
    
    @IBAction func datePicker(_ sender: UIDatePicker) {
        if textDuration.text == "0" {
            textDuration.text = "1"
            stepperDuration.value = 1.0
        }
        buttonReserve.isEnabled = true
        checkAvailability()
    }
    
    @IBAction func stepperDuration(_ sender: UIStepper) {
        textDuration.text = String(format: "%i", Int(sender.value))
        if Int(sender.value) > 0 {
            buttonReserve.isEnabled = true
            checkAvailability()
        }
        else {
            buttonReserve.isEnabled = false
            self.labelAvailability.text = ""
        }
    }
    
    @IBAction func buttonReserve(_ sender: UIButton) {
        var date = datePicker.date
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        var dict = [Any]()
        
        let days = Int(self.textDuration.text!)
        for _ in 1 ... Int(days!) {
            let dateString = dateFormatter.string(from: date)
            dict.append(["item_id": g_currentItemId, "date": dateString, "phone_number": g_phoneNumber])
            date.addTimeInterval(24 * 60 * 60)
        }
        
        httpRequest(url: "/reservations", method: "POST", body: dict) { json in
            showMessage(viewController: self, title: "Reserved!", message: "", autoClose: true)
            
            DispatchQueue.main.async {
                self.datePicker.date = self.datePicker.minimumDate!
                self.textDuration.text = "0"
                self.stepperDuration.value = 0.0
                self.labelAvailability.text = ""
                self.buttonReserve.isEnabled = false
            }
        }
    }
}
