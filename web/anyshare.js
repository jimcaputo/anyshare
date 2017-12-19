//var SERVER = 'http://lakeuniontech.asuscomm.com:8080';
var SERVER = 'http://127.0.0.1:8080';

var APP_STATE = {
    USER_LIST: 'USER_LIST',
    ITEM_LIST: 'ITEM_LIST',
    ITEM_VIEW: 'ITEM_VIEW',
};


var g_currentUserPhone;
var g_currentUserName;
var g_currentItemId;
var g_currentAppState;


function updateAppState(appState) {
  g_currentAppState = appState;

  v_user_list.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';

  if (appState == APP_STATE.USER_LIST) {
    v_user_list.$el.style.display = "block"; 
    v_navigation.page_name = '';
  } 
  else if (appState == APP_STATE.ITEM_LIST) {
    v_item_list.$el.style.display = 'block';
    v_navigation.page_name = 'User List';
  }
  else if (appState == APP_STATE.ITEM_VIEW) {
    v_item_view.$el.style.display = 'block'; 
    v_navigation.page_name = 'Item List';
  }
}

var v_navigation = new Vue({
  el: '#navigation',
  data: {
    page_name: ''
  },
  methods: {
    onClick: function() {
      if (g_currentAppState == APP_STATE.ITEM_LIST) {
        updateAppState(APP_STATE.USER_LIST);
      } 
      else if (g_currentAppState == APP_STATE.ITEM_VIEW) {
        updateAppState(APP_STATE.ITEM_LIST);
      } 
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
      fetch(SERVER + '/items/' + user.phone_number).then(function(response) {
        return response.json();
      }).then(function(json) { 
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
      fetch(SERVER + '/status/' + item.item_id).then(function(response) {
        return response.json();
      }).then(function(json) { 
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
    }
  },
  methods: {
    activate: function() {
      var json = {
        item_id: g_currentItemId,
        active: 'true',
        phone_number: g_currentPhoneNumber
      };
      var vue = this;

      fetch(SERVER + '/status', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
      }).then(function(response) {
        vue.status.active = 'true';
        vue.status.phone_number = g_currentPhoneNumber;
        vue.status.user_name = g_currentUserName;
      });
    },
    deactivate: function() {
      var json = {
        item_id: g_currentItemId,
        active: 'false',
        phone_number: ''
      };
      var vue = this;

      fetch(SERVER + '/status', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
      }).then(function(response) {
        vue.status.active = 'false';
      });
    }
  }
});


fetch(SERVER + '/users').then(function(response) {
  return response.json();
}).then(function(json) { 
  v_user_list.users = json.users;
});

updateAppState(APP_STATE.USER_LIST);

