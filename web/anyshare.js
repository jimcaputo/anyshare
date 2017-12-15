
var APP_STATE = {
    USER_LIST: 'USER_LIST',
    ITEM_LIST: 'ITEM_LIST',
    ITEM_VIEW: 'ITEM_VIEW',
};

function updateAppState(appState) {
  v_user_list.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';

  if (appState == APP_STATE.USER_LIST) {
    v_user_list.$el.style.display = "block";
  } else if (appState == APP_STATE.ITEM_LIST) {
    v_item_list.$el.style.display = 'block';
    
  } else if (appState == APP_STATE.ITEM_VIEW) {
    v_item_view.$el.style.display = 'block';
  }
}

var v_user_list = new Vue({
  el: '#user_list',
  data: {
    users: []
  },
  methods: {
    user_onClick: function(user) {

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
      updateAppState(APP_STATE.ITEM_VIEW)
     /* fetch('status.json').then(function(response) {
        return response.json();
      }).then(function(json) { 
        item_list.items = json.items;
      }); */
    }
  }
});

var v_item_view = new Vue({
  el: '#item_view',
  data: {
    status: {
      active: false,
      phone_number: '',
      user_name: ''
    }
  }
});


fetch('http://lakeuniontech.asuscomm.com:8080/users').then(function(response) {
  return response.json();
}).then(function(json) { 
  v_user_list.users = json.users;
});

updateAppState(APP_STATE.ITEM_LIST);



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