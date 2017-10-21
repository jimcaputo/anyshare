//
//  RegistrationViewController.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/22/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import Foundation
import UIKit

class RegistrationViewController: UIViewController {
    
    @IBOutlet weak var textPhoneNumber: UITextField!
    @IBOutlet weak var textUserName: UITextField!
    @IBOutlet weak var buttonSubmit: UIButton!
    @IBOutlet weak var labelMessage: UILabel!
    @IBOutlet weak var labelValidationCode: UILabel!
    @IBOutlet weak var textValidationCode: UITextField!
    @IBOutlet weak var buttonValidate: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        labelMessage.isHidden = true
        labelValidationCode.isHidden = true
        textValidationCode.isHidden = true
        buttonValidate.isHidden = true
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    @IBAction func buttonSubmit(_ sender: UIButton) {
        let phoneNumber = validatePhoneNumber(phoneNumber: textPhoneNumber.text!)
        if phoneNumber == nil {
            showMessage(viewController: self, title: "Invalid phone number",
                message: textPhoneNumber.text! + " is not a valid phone number.  Please enter a 10 digit phone number",
                autoClose: false)
            return
        }
        let userName = textUserName.text!
        if userName.characters.count < 2 || userName.characters.count > 15 {
            showMessage(viewController: self, title: "Invalid user name",
                message: userName + " is not a valid user name.  Please enter a user name longer than 2 characters and less than 15 characters.",
                autoClose: false)
            return
        }
        
        let dict = ["phone_number": phoneNumber, "user_name": userName]
        httpRequest(url: "/users", method: "POST", body: dict) { json in
            DispatchQueue.main.async {
                self.textPhoneNumber.isEnabled = false
                self.textUserName.isEnabled = false
                self.buttonSubmit.isEnabled = false
                self.labelMessage.isHidden = false
                self.labelValidationCode.isHidden = false
                self.textValidationCode.isHidden = false
                self.buttonValidate.isHidden = false
            }
        }
    }
    
    @IBAction func buttonValidate(_ sender: UIButton) {
        let dict = ["phone_number": validatePhoneNumber(phoneNumber: textPhoneNumber.text!), "validation_code": textValidationCode.text]
        httpRequest(url: "/users", method: "PATCH", body: dict) { json in
            UserDefaults.standard.set(self.textUserName.text, forKey: "UserName")
            UserDefaults.standard.set(self.textPhoneNumber.text, forKey: "PhoneNumber")
            g_userName = self.textUserName.text
            g_phoneNumber = self.textPhoneNumber.text
            DispatchQueue.main.async {
                self.dismiss(animated: true, completion: nil)
            }
        }
    }
}
