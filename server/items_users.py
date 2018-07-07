import json

import database


def get(item_id):
	sql = 'SELECT u.user_name, u.phone_number, i.phone_number_owner FROM users u ' \
		'JOIN items_users iu ON u.phone_number = iu.phone_number ' \
		'JOIN items i ON iu.item_id = i.item_id ' \
		'WHERE iu.item_id = {} ORDER BY u.user_name'.format(item_id)
	rows, response = database.read(sql)

	if response == 'Success':
		users = []
		for row in rows:
			users.append({
				'user_name': row[0],
				'phone_number': row[1],
				'phone_number_owner': row[2]
			})
		response = {'code': 200, 'users': users}
	else:
		response = {'code': 500, 'message': 'items_users.py:get - ' + response}

	return response


def add(request):
	item_user = request.get_json()
	sql = 'INSERT IGNORE INTO items_users (item_id, phone_number) VALUES ({}, {})' \
			.format(item_user['item_id'], item_user['phone_number'])
	response = database.insert_update_delete(sql)

	if response == 'Success':
		response = {'code': 200}
	else:
		response = {'code': 500, 'message': 'items_users.py:add - ' + response}

	return response


def update(request):
	item_user = request.get_json()
	if item_user['user_default'] == True:
		sql = 'UPDATE items_users SET user_default = (CASE WHEN item_id = {} THEN True ELSE False END) ' \
				'WHERE phone_number = "{}"'.format(item_user['item_id'], item_user['phone_number'])
	else:
		sql = 'UPDATE items_users SET user_default = False ' \
				'WHERE phone_number = "{}"'.format(item_user['phone_number'])
	response = database.insert_update_delete(sql)

	if response == 'Success':
		response = {'code': 200}
	else:
		response = {'code': 500, 'message': 'items_users.py:update - ' + response}

	return response


def delete(item_id, phone_number):
	sql = 'DELETE FROM items_users WHERE item_id = "{}" AND phone_number = "{}"'.format(item_id, phone_number)
	response = database.insert_update_delete(sql)

	if response == 'Success':
		response = {'code': 200}
	else:
		response = {'code': 500, 'message': 'items_users.py:delete - ' + response}

	return response
