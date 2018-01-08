//
//  Utility.swift
//  Anything Shared
//
//  Created by Jim Caputo on 7/22/17.
//  Copyright © 2017 Lake Union Tech. All rights reserved.
//

import Contacts
import Foundation
import UIKit


var g_server = "http://127.0.0.1:8080"
//var g_server = "http://192.168.1.200:8080"
//var g_server = "http://lakeuniontech.asuscomm.com:8080"

var g_userName: String!
var g_phoneNumber: String!
var g_currentItemId: String!
var g_currentItemName: String!
var g_accessToContacts: Bool = false


public func stripPhoneNumber(phoneNumber: String) -> String {
    var result = ""
    for (_, ch) in phoneNumber.enumerated() {
        if ch >= "0" && ch <= "9" {
            result += String(ch)
        }
    }
    if result.count != 10 {
        return "Invalid"
    }
    result = String(result.suffix(10))
    return result
}


public func formatPhoneNumber(phoneNumber: String) -> String {
    var result = ""
    var i = 0
    for (_, ch) in phoneNumber.enumerated() {
        if i == 3  ||  i == 6 {
            result += "-"
        }
        result += String(ch)
        i += 1
    }
    return result
}


public func validatePhoneNumber(phoneNumber: String) -> String! {
    let phoneNumberStripped = stripPhoneNumber(phoneNumber: phoneNumber)
    for (_, ch) in phoneNumberStripped.enumerated() {
        if !(ch >= "0" && ch <= "9") {
            return nil
        }
    }
    return phoneNumberStripped
}


public func httpGet(url: String, callback: @escaping (_ json: Dictionary<String, AnyObject>)->()) {
    let url = URL(string: g_server + url)!
    let task = URLSession.shared.dataTask(with: url, completionHandler: { data, response, error in
        let json = handleResponse(error: error, data: data)
        if json != nil {
            callback(json!)
        }
    })
    task.resume()
}


public func httpRequest(url: String, method: String, body: Any? = nil,
                        callback: @escaping (_ json: Dictionary<String, AnyObject>)->()) {
    var request = URLRequest(url: URL(string: g_server + url)!)
    request.httpMethod = method
    request.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
    if (body != nil) {
        let jsonBody = try? JSONSerialization.data(withJSONObject: body as Any)
        let jsonString = String(data: jsonBody!, encoding: .ascii)
        request.httpBody = jsonString?.data(using: .utf8)
    }
    
    let task = URLSession.shared.dataTask(with: request, completionHandler: { data, response, error in
        let json = handleResponse(error: error, data: data)
        if json != nil {
            callback(json!)
        }
    })
    task.resume()
}


public func handleResponse(error: Error?, data: Data?) -> Dictionary<String, AnyObject>? {
    if error != nil {
        displayError(error: error!.localizedDescription)
        return nil
    }
    else {
        let json = try? JSONSerialization.jsonObject(with: data!, options: .allowFragments) as! Dictionary<String, AnyObject>
        
        if json == nil {
            displayError(error: "Internal error occurred communicating with server")
            return nil
        }
        if json?["code"] as! Int != 200 {
            displayError(error: json?["message"] as! String)
            return nil
        }
        return json
    }
}


public func displayError(error: String) {
    print(error)
    
    let errorMessage = "Anything Shared encountered an error:  " + error
    let alert = UIAlertController(title: "Aw, snap!", message: errorMessage, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "Okay", style: .default))
    
    // Get the top most view controller
    var viewController = UIApplication.shared.keyWindow?.rootViewController
    while let presentedViewController = viewController?.presentedViewController {
        viewController = presentedViewController
    }
        
    DispatchQueue.main.async {
        viewController?.present(alert, animated: true)
    }
    
    let when = DispatchTime.now() + 5
    DispatchQueue.main.asyncAfter(deadline: when) {
        alert.dismiss(animated: true, completion: nil)
    }
}


public func showMessage(viewController: UIViewController, title: String, message: String, autoClose: Bool) {
    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "Okay", style: .default))
    viewController.present(alert, animated: true)
    
    if autoClose == true {
        let when = DispatchTime.now() + 3
        DispatchQueue.main.asyncAfter(deadline: when) {
            alert.dismiss(animated: true, completion: nil)
        }
    }
}


public func requestAccessToContacts() {
    let authorizationStatus = CNContactStore.authorizationStatus(for: CNEntityType.contacts)
    
    switch authorizationStatus {
        case .authorized:
            g_accessToContacts = true
            break
        
        default:
            break
    }
}
