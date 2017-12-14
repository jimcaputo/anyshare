from datetime import datetime

import database


# Retrieve the list of active reservations for a given item
def get(item_id, start_date, end_date):
    if start_date != None  and  end_date != None:
        sql = 'SELECT r.date, r.phone_number, u.user_name FROM reservations r ' \
            'JOIN users u on r.phone_number = u.phone_number ' \
            'WHERE item_id = {} AND date BETWEEN "{}" AND "{}" ' \
            'ORDER BY r.date;' \
            .format(item_id, start_date, end_date)
    else:
         sql = 'SELECT r.date, r.phone_number, u.user_name FROM reservations r ' \
            'JOIN users u on r.phone_number = u.phone_number ' \
            'WHERE item_id = {} ORDER BY r.date;'.format(item_id)
    rows, response = database.read(sql)

    if response == 'Success':
        reservations = []
 
        # Append all reservations with a date greater than or equal to today
        for row in rows:
            if row[0] >= datetime.date(datetime.now()):
                reservations.append({
                    'date': row[0].strftime('%Y-%m-%d'),
                    'phone_number': row[1],
                    'user_name': row[2]
                })
        response = {'code': 200, 'reservations': reservations}
    else:
        response = {'code': 500, 'message': 'reservations.py:get - ' + response}

    return response


# Creates a new reservation for a given item
#   JSON format:  [{'item_id': '2', date': '2017-07-12', 'phone_number': '2065551212'}, ...]
def create(request):
    reservations = request.get_json()
    sql = 'INSERT INTO reservations (item_id, date, phone_number) VALUES ' 
    for reservation in reservations:
        sql += '({}, "{}", "{}"), '.format(reservation['item_id'], reservation['date'], reservation['phone_number'])
    sql = sql[:-2] + ';'
    response, _ = database.insert_update_delete(sql)

    if response == 'Success':
        response = {'code': 200}
    else:
        response = {'code': 500, 'message': 'reservations.py:create - ' + response}

    return response
    

# Delete a reservation for a given item / date.  This assumes that the client ensured that the user_name
# matched the current user (ie you can only delete your own reservations).
def delete(item_id, date):
    sql = 'DELETE FROM reservations WHERE item_id = {} AND date = "{}"'.format(item_id, date)
    response, _ = database.insert_update_delete(sql)
        
    if response == 'Success':
        response = {'code': 200}
    else:
        response = {'code': 500, 'message': 'reservations.py:delete - ' + response}

    return response




