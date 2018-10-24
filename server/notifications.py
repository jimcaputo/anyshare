from datetime import datetime
from datetime import timedelta
import time

import database
import sms
import status


# Returns notifications for a given item_id and phone_number
def get(item_id, phone_number):
    sql = 'SELECT daily_notification FROM items_users WHERE item_id = {} AND phone_number = {}' \
        .format(item_id, phone_number)
    rows, response = database.read(sql)

    if response == 'Success'  and  len(rows) == 1:
        notifications = {
          'item_id': item_id,
          'phone_number': phone_number,
          'daily': rows[0][0]
        }
        response = {'code': 200, 'notifications': notifications}
    else:
        response = {'code': 500, 'message': 'notifications.py:get - ' + response}

    return response

# Sets value for notifications
def update(request):
  notifications = request.get_json()
  sql = 'UPDATE items_users SET daily_notification = {} WHERE item_id = {} AND phone_number = {}' \
      .format(notifications['daily_notification'], notifications['item_id'], notifications['phone_number'])
  response = database.insert_update_delete(sql)

  if response == 'Success':
    response = {'code': 200}
  else:
    response = {'code': 500, 'message': 'notifications.py:update - ' + response}

  return response



# Gets the next time to wake up.  Currently configured to wake up every morning at 8am.
def get_wakeup_time():
  wakeup_time = datetime.now()
  if wakeup_time.hour > 8:
    wakeup_time = wakeup_time + timedelta(days=1)
  wakeup_time = wakeup_time.replace(hour=8, minute=0, second=0)
  return wakeup_time


def send_notifications():
  sql = 'SELECT iu.phone_number, i.name, r.date FROM items_users iu ' \
      'JOIN items i ON iu.item_id = i.item_id ' \
      'LEFT JOIN ' \
        '(SELECT item_id, date FROM reservations WHERE date = DATE(NOW())) r ' \
      'ON i.item_id = r.item_id ' \
      'WHERE daily_notification = True ' \
      'ORDER BY iu.phone_number;'
  rows, response = database.read(sql)

  if response == 'Success':
    i = 0
    while i < len(rows):
      phone_number = rows[i][0]
      if rows[i][2] == None:
        message = rows[i][1] + ': Available today! :)'
      else:
        message = rows[i][1] + ': Reserved today. :('

      j = i + 1
      while j < len(rows)  and  rows[j][0] == phone_number:
        if rows[j][2] == None:
          message += '\n' + rows[j][1] + ': Available today! :)'
        else:
          message += '\n' + rows[j][1] + ': Reserved today. :('
        i = j
        j = j +1
      i = i + 1
      sms.send('+1' + phone_number, message)


def thread():
  while 1:
    wakeup_time = get_wakeup_time()
    sleep_duration = wakeup_time.timestamp() - datetime.now().timestamp()
    time.sleep(sleep_duration)
    send_notifications()

