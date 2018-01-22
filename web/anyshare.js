var SERVER = 'http://lakeuniontech.asuscomm.com:8080';
//var SERVER = 'http://127.0.0.1:8080';

var APP_STATE = {
    USER_LIST: 'USER_LIST',
    ITEM_LIST: 'ITEM_LIST',
    ITEM_VIEW: 'ITEM_VIEW',
    RESERVATIONS: 'RESERVATIONS',
    MANAGE_USERS: 'MANAGE_USERS'
};


var g_currentPhoneNumber = '';
var g_currentUserName = '';
var g_currentItemId = '';
var g_currentItemName = '';
var g_currentItemPhoneNumberOwner = '';

// For use by Vue rendering in HTML.  Provides easy read-only access to global variables and functions.
var global = {
  currentPhoneNumber: function() { return g_currentPhoneNumber; },
  currentUserName: function() { return g_currentUserName; },
  currentItemId: function() { return g_currentItemId; },
  currentItemName: function() { return g_currentItemName; },
  currentItemPhoneNumberOwner: function() { return g_currentItemPhoneNumberOwner; },

  formatPhoneNumber: function(phoneNumber) { return formatPhoneNumber(phoneNumber); }
};


function updateAppState(appState, updateBrowserState = true) {
  v_navigation.app_state = appState;
  
  v_user_list.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';
  v_reservations.$el.style.display = 'none';
  v_manage_users.$el.style.display = 'none';

  if (updateBrowserState == true) {
    history.pushState({app_state: appState}, '', '');
  }

  if (appState == APP_STATE.USER_LIST) {
    v_user_list.show();
  }
  else if (appState == APP_STATE.ITEM_LIST) {
    v_item_list.show();
  }
  else if (appState == APP_STATE.ITEM_VIEW) {
    v_item_view.show();
  }
  else if (appState == APP_STATE.RESERVATIONS) {
    v_reservations.show();
  }
  else if (appState == APP_STATE.MANAGE_USERS) {
    v_manage_users.show();
  }
  log('updateAppState: Transitioning to APP_STATE.' + appState);
}

window.onpopstate = function(event) {
  log('onpopstate: ' + event.state.app_state);
  updateAppState(event.state.app_state, false);
};

var v_navigation = new Vue({
  el: '#navigation',
  data: {
    global: global,
    app_state: ''
  },
  methods: {
    onClick: function(appState) {
      updateAppState(appState);
    }
  }
});

var v_user_list = new Vue({
  el: '#user_list',
  data: {
    users: []
  },
  methods: {
    show: function() {
      this.$el.style.display = "block";
    },
    user_onClick: function(user) {
      g_currentUserName = user.user_name;
      g_currentPhoneNumber = user.phone_number;
      httpGet('/items/' + user.phone_number, function(json) {
        v_item_list.items = json.items;
        updateAppState(APP_STATE.ITEM_LIST);
      });
    }
  }
});

var v_item_list = new Vue({
  el: '#item_list',
  data: {
    global: global,
    items: [],
    item_delete: null,
    item_create_name: ''
  },
  methods: {
    show: function() {
      this.$el.style.display = "block";
    },
    item_onClick: function(item) {
      g_currentItemId = item.item_id;
      g_currentItemName = item.name;
      g_currentItemPhoneNumberOwner = item.phone_number_owner;
      httpGet('/status/' + g_currentItemId, (json) => {
        v_item_view.name = item.name;
        v_item_view.status = json.status;
        updateAppState(APP_STATE.ITEM_VIEW);
      });
    },
    delete_onClick: function(item) {
      item_delete = item;
      document.getElementById('item_delete_dialog').classList.add('active');
    },
    yes_onClick: function() {
      httpDelete('/items/' + item_delete.item_id, () => {
        httpGet('/items/' + g_currentPhoneNumber, (json) => {
          this.items = json.items;
        });
      });
      document.getElementById('item_delete_dialog').classList.remove('active');
    },
    no_onClick: function() {
      document.getElementById('item_delete_dialog').classList.remove('active');
    },
    create_onClick: function() {
      var json = {
        name: this.item_create_name,
        phone_number_owner: g_currentPhoneNumber
      };
      httpPost('/items', JSON.stringify(json), () => {
        this.item_create_name = '';
        httpGet('/items/' + g_currentPhoneNumber, (json) => {
          this.items = json.items;
        });
      });
    }
  }
});

var v_item_view = new Vue({
  el: '#item_view',
  data: {
    name: '',
    status: {
      active: 'false',
      phone_number: '',
      user_name: ''
    },
    active_user: false,     // Computed to true, if current user is actively using this item.
    today: '',
    date: '',
    days: 0,
    available: false,
    availabilityMessage: ''
  },
  methods: {
    show: function() {
      this.$el.style.display = 'block';
      this.today = formatDate(new Date());
      this.date = formatDate(new Date());
      this.days = 0;
      if (this.status.active == 'true'  &&  this.status.phone_number == g_currentPhoneNumber) {
        this.active_user = true;
      } else {
        this.active_user = false;
      }
    },
    activate_onClick: function() {
      var json = {
        item_id: g_currentItemId,
        active: 'true',
        phone_number: g_currentPhoneNumber
      };
      httpPost('/status', JSON.stringify(json), () => {
        this.status.active = 'true';
        this.status.phone_number = g_currentPhoneNumber;
        this.status.user_name = g_currentUserName;
        this.active_user = true;
      });
    },
    deactivate_onClick: function() {
      var json = {
        item_id: g_currentItemId,
        active: 'false',
        phone_number: ''
      };
      httpPost('/status', JSON.stringify(json), () => {
        this.status.active = 'false';
      });
    },
    reservations_onClick: function() {
      httpGet('/reservations/' + g_currentItemId, function(json) {
        v_reservations.reservations = json.reservations;
        updateAppState(APP_STATE.RESERVATIONS);
      });
    },
    updateAvailability: function() {
      if (this.days == 0) {
        this.days = 1;
      }

      var startDate = getLocaleDate(this.date);
      var endDate = new Date(startDate);
      endDate.setTime(endDate.getTime() + this.days * 24 * 60 * 60 * 1000);

      var url = '/reservations/' + g_currentItemId + '/' + formatDate(startDate) + '/' + formatDate(endDate);
      httpGet(url, (json) => {
        this.available = json.reservations.length == 0 ? true : false;
        var message = json.reservations.length == 0 ? 'AVAILABLE: ' : 'UNAVAILABLE: ';
        message += getDayString(startDate) + ', ' + getMonthString(startDate) + ' ' + startDate.getDate() +
            ' - ' + getDayString(endDate) + ', ' + getMonthString(endDate) + ' ' + endDate.getDate();
        this.availabilityMessage = message;
      });
    },
    reserve_onClick: function() {
      var reservations = [];
      var date = getLocaleDate(this.date);

      for (var i = 0; i < this.days; i++) {
        reservations.push({
          item_id: g_currentItemId,
          date: formatDate(date),
          phone_number: g_currentPhoneNumber
        });
        date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
      }

      httpPost('/reservations', JSON.stringify(reservations), () => {
        this.date = formatDate(new Date());
        this.days = 0;
        this.available = '';
        v_info_dialog.show('Confirmation', 'Reserved!', true);
      });
    },
    manageUsers_onClick: function() {
      httpGet('/items_users/' + g_currentItemId, (json) => {
        v_manage_users.users = json.users;
        updateAppState(APP_STATE.MANAGE_USERS);
      });
    }
  }
});

var v_reservations = new Vue({
  el: '#reservations',
  data: {
    global: global,
    reservations: []
  },
  methods: {
    show: function() {
      this.$el.style.display = "block";
    },
    delete_onClick: function(reservation) {
      httpDelete('/reservations/' + g_currentItemId + '/' + reservation.date, () => {
        var i = this.reservations.indexOf(reservation);
        this.reservations.splice(i, 1);
      });
    }
  }
});

var v_manage_users = new Vue({
  el: '#manage_users',
  data: {
    global: global,
    search_phone_number: '',
    search_user: null,
    show_search_result: false,
    users: []
  },
  methods: {
    show: function() {
      this.search_phone_number = '';
      this.show_search_result = false;
      this.$el.style.display = "block";
    },
    search_onClick: function() {
      var searchPhoneNumber = stripPhoneNumber(this.search_phone_number);
      if (searchPhoneNumber == null) {
        v_info_dialog.show('User Search', 'Invalid phone number: ' + this.search_phone_number);
        return;
      }
      httpGet('/users/' + searchPhoneNumber, (json) => {
        if (json.users.length > 0) { 
          this.search_user = json.users[0];
          this.show_search_result = true;
        }
        else {
          v_info_dialog.show('User Search', 'Phone number not found');
        }
      });
    },
    add_onClick: function(user) {
      var json = {
        item_id: g_currentItemId,
        phone_number: this.search_user.phone_number
      };
      httpPost('/items_users', JSON.stringify(json), () => {
        this.show_search_result = false;
        httpGet('/items_users/' + g_currentItemId, (json) => {
          this.users = json.users;
        });
      }) 
    },
    remove_onClick: function(user) {
      httpDelete('/items_users/' + g_currentItemId + '/' + user.phone_number, () => {
        var i = this.users.indexOf(user);
        this.users.splice(i, 1);
      });
    }
  }
});

var v_info_dialog = new Vue({
  el: '#info_dialog',
  data: {
    title: '',
    message: ''
  },
  methods: {
    show: function(title, message, timeout = false) {
      this.title = title;
      this.message = message;
      document.getElementById('info_dialog').classList.add('active');
      if (timeout) {
        setTimeout(function() { 
          document.getElementById('info_dialog').classList.remove('active'); 
        }, 2500);
      }
    },
    okay_onClick: function() {
      document.getElementById('info_dialog').classList.remove('active');
    }
  }
});


function httpGet(url, callback) {
  log('httpGet: ' + url);
  fetch(SERVER + url)
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpGet:  Fetch failure. Status Code: ' + response.status);
          return;
        }
        response.json().then(function(json) {
          log('httpPost: Response: ' + JSON.stringify(json));
          callback(json);
        });
      }
    )
    .catch(function(err) {
      log('httpGet: Fetch exception: ' + err);
    });
}

function httpPost(url, body, callback) {
  log('httpPost: ' + url + ' ' + body)
  fetch(SERVER + url, {
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
          return;
        }
        response.json().then(function(json) {
          log('httpPost: Response: ' + JSON.stringify(json));
          callback(json);
        });
      }
    )
    .catch(function(err) {
      log('httpPost: Fetch exception: ' + err);
    });
}

function httpDelete(url, callback) {
  log('httpDelete: ' + url);
  fetch(SERVER + url, {method: 'DELETE'})
    .then(
      function(response) {
        if (response.status != 200) {
          log('httpDelete:  Fetch failure. Status Code: ' + response.status);
          return;
        }
        response.json().then(function(json) {
          log('httpDelete: Response: ' + JSON.stringify(json));
          callback(json);
        });
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

function getLocaleDate(dateString) {
  // Expects the format yyyy-mm-dd
  var parts = dateString.split('-');
  // Note - Javascript counts months from 0, hence the -1 for that part.
  var date = new Date(parts[0], parts[1] - 1, parts[2]); 
  return date;
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

function formatPhoneNumber(phoneNumber) {
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

function log(text) {
  var date = new Date();
  console.log(date.toLocaleTimeString() + ' - ' + text);
}


httpGet('/users', function(json) {
  v_user_list.users = json.users;
});

document.getElementById('navigation').style.display = 'block';
updateAppState(APP_STATE.USER_LIST);

