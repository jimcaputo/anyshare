var SERVER = 'http://lakeuniontech.asuscomm.com:8080';

var APP_STATE = {
    USER_LIST: 'USER_LIST',
    ITEM_LIST: 'ITEM_LIST',
    ITEM_VIEW: 'ITEM_VIEW',
};


var g_currentUserPhone;
var g_currentUserName;
var g_currentItemId;


function updateAppState(appState) {
  v_user_list.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';

  if      (appState == APP_STATE.USER_LIST)   { v_user_list.$el.style.display = "block"; } 
  else if (appState == APP_STATE.ITEM_LIST)   { v_item_list.$el.style.display = 'block'; }
  else if (appState == APP_STATE.ITEM_VIEW)   { v_item_view.$el.style.display = 'block'; }
}

var v_user_list = new Vue({
  el: '#user_list',
  data: {
    users: []
  },
  methods: {
    user_onClick: function(user) {
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
      fetch(SERVER + '/status/' + item.item_id).then(function(response) {
        return response.json();
      }).then(function(json) { 
        v_item_view.item = item;
        v_item_view.status = json;
        updateAppState(APP_STATE.ITEM_VIEW);  
      });
    }
  }
});

var v_item_view = new Vue({
  el: '#item_view',
  data: {
    item: null,
    status: {
      active: false,
      phone_number: '',
      user_name: ''
    }
  },
  methods: {
    activate: function() {
      var json = {
        item_id: this.item.item_id,
        active: true,
        phone_number: this.item.phone_number
      };

      /*fetch(SERVER + '/status/' + item.item_id).then(function(response) {
        return response.json();
      }).then(function(json) { 
        v_item_view.status = json
      });*/
    }
  }
});


fetch('http://lakeuniontech.asuscomm.com:8080/users').then(function(response) {
  return response.json();
}).then(function(json) { 
  v_user_list.users = json.users;
});

updateAppState(APP_STATE.USER_LIST);



/*
fetch('http://lakeuniontech.asuscomm.com:8080/items/2063567329').then(function(response) {
  return response.json();
}).then(function(json) { 
  v_item_list.items = json.items;
});

updateAppState(APP_STATE.ITEM_LIST);


/*
fetch('items.json').then(function(response) {
  return response.json();
}).then(function(json) { 
  v_item_list.items = json.items;
});

updateAppState(APP_STATE.ITEM_LIST);

fetch('http://lakeuniontech.asuscomm.com:8080/users').then(function(response) {
  return response.text();
}).then(function(text) { 
  alert(text);
});

*/