
function httpGet(url, callback, errorHandler=null) {
  log('httpGet: ' + url);
  fetch(url)
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpGet:  Fetch failure. Status Code: ' + response.status);
          if (errorHandler) {
            errorHandler(response.status);
          }
        }
        else {
          response.json().then(function(json) {
            log('httpPost: Response: ' + JSON.stringify(json));
            callback(json);
          });
        }
      }
    )
    .catch(function(err) {
      log('httpGet: Fetch exception: ' + err);
    });
}

function httpPost(url, body, callback, errorHandler=null) {
  log('httpPost: ' + url + ' ' + body)
  fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: body})
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpPost:  Fetch failure. Status Code: ' + response.status);
          if (errorHandler) {
            errorHandler(response.status);
          }
        } else {
          response.json().then(function(json) {
            log('httpPost: Response: ' + JSON.stringify(json));
            callback(json);
          });
        }
      }
    )
    .catch(function(err) {
      log('httpPost: Fetch exception: ' + err);
    });
}

function httpPatch(url, body, callback, errorHandler=null) {
  log('httpPatch: ' + url + ' ' + body)
  fetch(url, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: body})
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpPatch:  Fetch failure. Status Code: ' + response.status);
          if (errorHandler) {
            errorHandler(response.status);
          }
        }
        else {
          response.json().then(function(json) {
            log('httpPatch: Response: ' + JSON.stringify(json));
            callback(json);
          });
        }
      }
    )
    .catch(function(err) {
      log('httpPatch: Fetch exception: ' + err);
    });
}

function httpDelete(url, callback, errorHandler=null) {
  log('httpDelete: ' + url);
  fetch(url, {method: 'DELETE'})
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpDelete:  Fetch failure. Status Code: ' + response.status);
          if (errorHandler) {
            errorHandler(response.status);
          }
        }
        else {
          response.json().then(function(json) {
            log('httpDelete: Response: ' + JSON.stringify(json));
            callback(json);
          });
        }
      }
    )
    .catch(function(err) {
      log('httpDelete: Fetch exception: ' + err);
    });
}

function formatDate(date) {
  var result = date.getFullYear() + '-';
  if (date.getMonth() < 10) {
    result += '0';
  } 
  result += date.getMonth() + 1 + '-';
  if (date.getDate() < 10) {
    result += '0';
  }
  result += date.getDate();
  return result;
}

function formatDateTime(dateTime) {
  var result = formatDate(dateTime);
  result += ' ';
  if (dateTime.getHours() < 10) {
    result += '0';
  }
  result += dateTime.getHours() + ':';
  if (dateTime.getMinutes() < 10) {
    result += '0';
  }
  result += dateTime.getMinutes();
  return result;
}

function getLocaleDate(dateString) {
  // Expects the format yyyy-mm-dd
  var parts = dateString.split('-');
  // Note - Javascript counts months from 0, hence the -1 for that part.
  var date = new Date(parts[0], parts[1] - 1, parts[2]); 
  return date;
}

function getLocalTime(timeString) {
  // Expects the format yyyy-mm-dd hh:mm
  var parts = timeString.split('-');
  var hour = timeString.split(' ')[1].substr(0, 2);
  var minute = timeString.split(':')[1];
  // Note - Javascript counts months from 0, hence the -1 for that part.
  var time = new Date(parts[0], parts[1] - 1, parts[2].substr(0, 2), hour, minute); 
  return time;
}

function getDayString(date) {
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function getMonthString(date) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

function stripPhoneNumber(phoneNumber) {
  var result = '';
  for (var i = 0; i < phoneNumber.length; i++) {
    if (phoneNumber[i] >= '0' && phoneNumber[i] <= '9') {
      result += phoneNumber[i];
    }
  }
  if (result.length < 10) {
      return null;
  }
  result = result.substr(result.length - 10);
  return result;
}

function displayPhoneNumber(phoneNumber) {
  var result = '';
  var pos = 0;
  for (var i = 0; i < phoneNumber.length; i++) {
    if (pos == 3  ||  pos == 6) {
      result += '-';
    }
    pos++;
    result += phoneNumber[i];
  }
  return result;
}

function displayDate(dateString) {
  // Expects the format yyyy-mm-dd
  var parts = dateString.split('-');
  // Note - Javascript counts months from 0, hence the -1 for that part.
  var date = new Date(parts[0], parts[1] - 1, parts[2]);
  return getDayString(date) + ', ' + getMonthString(date) + ' ' + date.getDate();
}

function displayTime(dateTime) {
  if (dateTime.getHours() == 0  &&  dateTime.getMinutes() == 0) {
    return 'end of day';
  }
  var time = dateTime.toLocaleTimeString();
  time = time.substring(0, time.indexOf(':', 3)) + ' ' + time.substr(time.length - 2);
  return time;
}

function log(text) {
  var date = new Date();
  console.log(date.toLocaleTimeString() + ' - ' + text);
}

function getCookie(key) {
    var value = ' ' + document.cookie;
    var start = value.indexOf(' ' + key + '=');
    if (start == -1) {
        value = null;
    }
    else {
        start = value.indexOf('=', start) + 1;
        var end = value.indexOf(';', start);
        if (end == -1) {
            end = value.length;
        }
        value = value.substring(start, end);
    }
    return value;
}

var deleteCookie = function(key) {
    document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

