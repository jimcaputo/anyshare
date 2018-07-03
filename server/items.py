from datetime import datetime

import database


# Retrieve the list of items for this user
def get(phone_number):
    sql = 'SELECT i.item_id, i.name, i.phone_number_owner FROM items i ' \
        'JOIN items_users iu ON i.item_id = iu.item_id ' \
        'WHERE iu.phone_number = {} ORDER BY i.name'.format(phone_number)
    rows, response = database.read(sql)

    if response == 'Success':
        items = []
        for row in rows:
            items.append({
                'item_id': str(row[0]),
                'name': row[1],
                'phone_number_owner': str(row[2])
            })
        response = {'code': 200, 'items': items}
    else:
        response = {'code': 500, 'message': 'items.py:get - ' + response}

    return response


def create(request):
    item = request.get_json() 
    sql = 'CALL item_add("{}", "{}");'.format(item['name'], item['phone_number_owner']) 
    response = database.insert_update_delete(sql)

    if response == 'Success':
        response = {'code': 200}
    else:
        response = {'code': 500, 'message': 'items.py:create - ' + response}

    return response


def delete(item_id):
    sql = 'CALL item_delete({});'.format(item_id)
    response = database.insert_update_delete(sql)

    if response == 'Success':
        response = {'code': 200}
    else:
        response = {'code': 500, 'message': 'items.py:delete - ' + response}

    return response

