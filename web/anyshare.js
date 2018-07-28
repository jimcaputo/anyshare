
var APP_STATE = {
    SIGN_IN: 'SIGN_IN',
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

g_currentUserName = getCookie('user_name');
g_currentPhoneNumber = getCookie('phone_number');


// For use by Vue rendering in HTML.  Provides easy read-only access to global variables and functions.
var global = {
  currentPhoneNumber: function() { return g_currentPhoneNumber; },
  currentUserName: function() { return g_currentUserName; },
  currentItemId: function() { return g_currentItemId; },
  currentItemName: function() { return g_currentItemName; },
  currentItemPhoneNumberOwner: function() { return g_currentItemPhoneNumberOwner; },

  displayPhoneNumber: function(phoneNumber) { return displayPhoneNumber(phoneNumber); },
  displayDate: function(dateString) { return displayDate(dateString); },
  displayTime: function(dateTime) { return displayTime(dateTime); }
};


function updateAppState(appState, updateBrowserState = true) {
  v_navigation.app_state = appState;
  
  v_sign_in.$el.style.display = 'none';
  v_item_view.$el.style.display = 'none';
  v_item_list.$el.style.display = 'none';
  v_reservations.$el.style.display = 'none';
  v_manage_users.$el.style.display = 'none';

  if (updateBrowserState == true) {
    history.pushState({app_state: appState}, '', '');
  }

  if (appState == APP_STATE.SIGN_IN) {
    v_navigation.$el.style.display = 'none';
  }
  else {
    v_navigation.$el.style.display = 'block'; 
  }

  if (appState == APP_STATE.SIGN_IN) {
    v_sign_in.show();
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
    },
    user_onClick: function() {
      v_user_dialog.show();
    }
  }
});

var v_sign_in = new Vue({
  el: '#sign_in',
  data: {
    phone_number: '',
    register_clicked: false,
    verification_code: '',
    show_verify: false
  },
  methods: {
    show: function() {
      this.$el.style.display = 'block';
      this.phone_number = '';
      this.register_clicked = false;
      this.verification_code = '';
      this.show_verify = false;
    },
    register_onClick: function() {
      this.register_clicked = true;
      this.show_verify = true;

      var json = {
        phone_number: stripPhoneNumber(this.phone_number)
      };
      httpPost('/users', JSON.stringify(json), () => {
      });
    },
    verify_onClick: function() {
      var json = {
        phone_number: stripPhoneNumber(this.phone_number),
        validation_code: this.verification_code
      };
      httpPatch('/users', JSON.stringify(json), () => {
        httpGet('/users/' + stripPhoneNumber(this.phone_number), function(json) {
          document.cookie = 'phone_number=' + json.user.phone_number + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
          g_currentPhoneNumber = json.user.phone_number;

          if (json.user.user_name != null) {
            document.cookie = 'user_name=' + json.user.user_name + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
            g_currentUserName = json.user.user_name;
          }
          else {
            v_user_dialog.show();
          }

          httpGet('/items/' + g_currentPhoneNumber, function(json) {
            v_item_list.items = json.items;
            updateAppState(APP_STATE.ITEM_LIST);
          });
        });
      }, 
      (error) => {
        if (error == '404') {
          v_info_dialog.show('Verification Failure', 'Incorrect Verification Code', true);
        }
      });
    }
  }
});

var v_user_dialog = new Vue({
  el: '#user_dialog',
  data: {
    user_name: ''
  },
  methods: {
    show: function() {
      this.user_name = g_currentUserName;
      document.getElementById('user_dialog').classList.add('active');
    },
    setUserName_onClick: function() {
      var json = {
        phone_number: stripPhoneNumber(g_currentPhoneNumber),
        user_name: this.user_name
      };
      httpPatch('/users', JSON.stringify(json), () => {
        document.cookie = 'user_name=' + this.user_name + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
        g_currentUserName = this.user_name;
        document.getElementById('user_dialog').classList.remove('active');
      });
      
    },
    cancel_onClick: function() {
      document.getElementById('user_dialog').classList.remove('active');
    },
    signOut_onClick: function() {
      document.getElementById('user_dialog').classList.remove('active');
      g_currentPhoneNumber = '';
      g_currentUserName = '';
      g_currentItemId = 0;
      g_currentItemName = '';
      g_currentItemPhoneNumberOwner = '';

      deleteCookie('user_name');
      deleteCookie('phone_number');
      updateAppState(APP_STATE.SIGN_IN);
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
      this.$el.style.display = 'block';
    },
    item_onClick: function(item) {
      g_currentItemId = item.item_id;
      g_currentItemName = item.name;
      g_currentItemPhoneNumberOwner = item.phone_number_owner;
      v_item_view.name = item.name;
      updateAppState(APP_STATE.ITEM_VIEW);
    },
    default_onClick: function(item) {
      var json = {
        phone_number: g_currentPhoneNumber,
        item_id: item.item_id,
        user_default: !item.user_default
      }
      httpPatch('/items_users', JSON.stringify(json), () => {
        httpGet('/items/' + g_currentPhoneNumber, (json) => {
          this.items = json.items;
        });
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
    global: global,
    name: '',
    status: {
      active: 'false',
      phone_number: '',
      user_name: '',
      start_time: '',
      end_time: ''
    },
    active_user: false,     // Computed to true, if current user is actively using this item.
    duration: 'today',        // Duration of the activation (ie 4 hours).
    tomorrow: '',
    date: '',
    days: 0,
    available: false,
    availabilityMessage: ''
  },
  methods: {
    show: function() {
      this.$el.style.display = 'block';

      var tomorrow = new Date();
      tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      this.tomorrow = formatDate(tomorrow);
      this.date = formatDate(tomorrow);
      this.days = 0;

      httpGet('/status/' + g_currentItemId, (json) => {
        this.status = json.status;
        if (this.status.active == 'true') {
          if (this.status.end_time) {
            this.status.end_time = getLocalTime(this.status.end_time);
          }
          if (this.status.phone_number == g_currentPhoneNumber) {
            this.active_user = true;
          }
        } else {
          this.active_user = false;
        }
      });
    },
    activate_onClick: function() {
      var startTime = new Date();
      var endTime = new Date();
      if (this.duration == 'today') {
        endTime.setTime(startTime.getTime() + 24 * 60 * 60 * 1000);
        endTime.setHours(0, 0);
      }
      else if (this.duration == 'hour1') {
        endTime.setTime(startTime.getTime() + 1 * 60 * 60 * 1000);
      }
      else if (this.duration == 'hour2') {
        endTime.setTime(startTime.getTime() + 2 * 60 * 60 * 1000);
      }
      else if (this.duration == 'hour4') {
        endTime.setTime(startTime.getTime() + 4 * 60 * 60 * 1000);
      }
      else if (this.duration == 'hour8') {
        endTime.setTime(startTime.getTime() + 8 * 60 * 60 * 1000);
      }
      
      var json = {
        item_id: g_currentItemId,
        active: 'true',
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        phone_number: g_currentPhoneNumber
      };
      httpPost('/status', JSON.stringify(json), () => {
        this.status.active = 'true';
        this.status.phone_number = g_currentPhoneNumber;
        this.status.user_name = g_currentUserName;
        this.active_user = true;
        this.status.end_time = endTime;
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
      // Calculate the end date for the reservation.  We subtract 1 because if only 1 day, the text should
      // read:  "Apr 1 - Apr 1"  Then multiply to get the number of seconds.  
      endDate.setTime(endDate.getTime() + (this.days - 1) * 24 * 60 * 60 * 1000);

      var url = `/reservations/${g_currentItemId}/${formatDate(startDate)}/${formatDate(endDate)}`;
      httpGet(url, (json) => {
        this.available = json.reservations.length == 0 ? true : false;
        var message = json.reservations.length == 0 ? 'AVAILABLE: ' : 'UNAVAILABLE: ';
        message += `${getDayString(startDate)}, ${getMonthString(startDate)} ${startDate.getDate()} - `;
        message += `${getDayString(endDate)}, ${getMonthString(endDate)} ${endDate.getDate()}`;
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
        var tomorrow = new Date();
        tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        this.date = formatDate(tomorrow);
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
    reservations: [],
    groupedReservations: []
  },
  methods: {
    show: function() {
      this.groupedReservations = new Array();
      for (var i = 0; i < this.reservations.length; i++) {
        this.groupedReservations.push({
          id: '',
          phoneNumber: this.reservations[i].phone_number,
          userName: this.reservations[i].user_name,
          startDate: this.reservations[i].date,
          endDate: '',
          days: new Array()
        });
        var index = this.groupedReservations.length - 1;
        this.groupedReservations[index].days.push({
          phoneNumber: this.reservations[i].phone_number,
          userName: this.reservations[i].user_name,
          date: this.reservations[i].date
        });
        for (var j = i + 1; j < this.reservations.length; j++) {
          var date1 = new Date(this.reservations[j - 1].date);
          var date2 = new Date(this.reservations[j].date);
          date2.setTime(date2.getTime() - 24 * 60 * 60 * 1000);
          if (this.reservations[j - 1].phone_number == this.reservations[j].phone_number  &&  date1.getTime() == date2.getTime()) {
            this.groupedReservations[index].days.push({
              phoneNumber: this.reservations[j].phone_number,
              userName: this.reservations[j].user_name,
              date: this.reservations[j].date,
              display: false
            });
          }
          else {
            break;
          }
        }
        i = j - 1;
        this.groupedReservations[index].endDate = this.reservations[i].date;
        this.groupedReservations[index].id = 'id' + 
          this.groupedReservations[index].startDate + this.groupedReservations[index].endDate;

        // Reset the arrow to original state.
        var checkbox = document.getElementById(this.groupedReservations[index].id);
        if (checkbox) {
          checkbox.checked = false;
        }
      } 
      this.$el.style.display = 'block';
    },
    expandCollapse: function(group) {
      var checkbox = document.getElementById(group.id);
      checkbox.checked = !checkbox.checked;

      for (var i = 0; i < group.days.length; i++) {
        var row = document.getElementById(group.days[i].date);
        group.days[i].display = checkbox.checked;
        Vue.set(group.days, i, group.days[i]);
      }
    },
    deleteAll_onClick: function(group) {
      document.getElementById(group.id).style.display = 'none';
      group.days.forEach((reservation) => {
        this.delete_onClick(reservation);
      })
    },
    delete_onClick: function(reservation) {
      httpDelete(`/reservations/${g_currentItemId}/${reservation.date}`, () => {
        var index = -1;
        for (var i = 0; i < this.reservations.length; i++) {
          if (this.reservations[i].date == reservation.date) {
            index = i;
            break;
          }
        }
        this.reservations.splice(index, 1);
        this.show();
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
      this.$el.style.display = 'block';
    },
    search_onClick: function() {
      var searchPhoneNumber = stripPhoneNumber(this.search_phone_number);
      if (searchPhoneNumber == null) {
        v_info_dialog.show('User Search', 'Invalid phone number: ' + this.search_phone_number);
        return;
      }
      httpGet('/users/' + searchPhoneNumber, (json) => {
        this.search_user = json.user;
        this.show_search_result = true;
        this.search_phone_number = '';
      },
      (error) => {
        if (error == '404') {
          v_info_dialog.show('User Search', 'Phone number not found', true); 
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


if (g_currentPhoneNumber == null) {
  updateAppState(APP_STATE.SIGN_IN);
}
else {
  if (g_currentUserName == null) {
    v_user_dialog.show();
  } 

  // Start by getting the list of items that the user has access to.  
  httpGet('/items/' + g_currentPhoneNumber, function(json) {
    v_item_list.items = json.items;
      
    var user_default_item = null;
    for (var i = 0; i < json.items.length; i++) {
      if (json.items[i].user_default == true) {
        user_default_item = json.items[i];
        break;
      }
    }
    if (user_default_item) {
      g_currentItemId = user_default_item.item_id;
      g_currentItemName = user_default_item.name;
      g_currentItemPhoneNumberOwner = user_default_item.phone_number_owner;
      v_item_view.name = user_default_item.name;
      updateAppState(APP_STATE.ITEM_VIEW);
    }
    else {
      updateAppState(APP_STATE.ITEM_LIST);
    }
  });
}





