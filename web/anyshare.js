//var SERVER = 'http://lakeuniontech.asuscomm.com:8080';
var SERVER = 'http://127.0.0.1:8080';

var APP_STATE = {
    USER_LIST: 'USER_LIST',
    ITEM_LIST: 'ITEM_LIST',
    ITEM_VIEW: 'ITEM_VIEW',
    RESERVATIONS: 'RESERVATIONS'
};


var g_currentUserPhone;
var g_currentUserName;
var g_currentItemId;


function formatDate(date) {
    date = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
    return date;
}

function updateAppState(appState) {
  v_navigation.app_state = appState;

  v_user_list.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';
  v_reservations.$el.style.display = 'none';

  if (appState == APP_STATE.USER_LIST) {
    v_user_list.$el.style.display = "block";
  }
  else if (appState == APP_STATE.ITEM_LIST) {
    v_item_list.$el.style.display = 'block';
  }
  else if (appState == APP_STATE.ITEM_VIEW) {
    v_item_view.$el.style.display = 'block';
  }
  else if (appState == APP_STATE.RESERVATIONS) {
    v_reservations.$el.style.display = 'block';
  }
  log('updateAppState: Transitioning to APP_STATE.' + appState);
}

var v_navigation = new Vue({
  el: '#navigation',
  data: {
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
    items: []
  },
  methods: {
    item_onClick: function(item) {
      g_currentItemId = item.item_id;
      httpGet('/status/' + g_currentItemId, function(json) {
        v_item_view.status = json.status;
        updateAppState(APP_STATE.ITEM_VIEW);
      });
    }
  }
});

var v_item_view = new Vue({
  el: '#item_view',
  data: {
    status: {
      active: 'false',
      phone_number: '',
      user_name: ''
    },
    date: '',
    days: 0,
    available: false
  },
  created: function() {
    this.date = formatDate(new Date());
  },
  methods: {
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
        v_reservations.current_phone_number = g_currentPhoneNumber;
        v_reservations.reservations = json.reservations;
        updateAppState(APP_STATE.RESERVATIONS);
      });
    },
    updateAvailability: function() {
      if (this.days == 0) {
        this.days = 1;
      }

      var startDate = new Date(this.date);
      var endDate = new Date(startDate);
      endDate.setTime(endDate.getTime() + this.days * 24 * 60 * 60 * 1000);

      var url = '/reservations/' + g_currentItemId + '/' + 
          formatDate(startDate) + '/' + formatDate(endDate);
      httpGet(url, (json) => {
        if (json.reservations.length > 0) {
          this.available = false;
        }
        else {
          this.available = true;
        }
      });
    },
    reserve_onClick: function() {
      var reservations = [];
      var date = new Date(this.date);

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
        this.available = false;
      });
    }
  }
});


var v_reservations = new Vue({
  el: '#reservations',
  data: {
    current_phone_number: '',
    reservations: []
  },
  methods: {
    delete_onClick: function(reservation) {
      httpDelete('/reservations/' + g_currentItemId + '/' + reservation.date, () => {
        var i = this.reservations.indexOf(reservation);
        this.reservations.splice(i, 1);
      });
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


function log(text) {
  var date = new Date();
  div = document.getElementById('logs');
  div.innerText = date.toLocaleTimeString() + ' - ' + text + '\n' + div.innerText;
}


httpGet('/users', function(json) {
  v_user_list.users = json.users;
});

updateAppState(APP_STATE.USER_LIST);

