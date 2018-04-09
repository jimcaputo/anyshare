from datetime import datetime

import database


def get(item_id):
	sql = 'SELECT i.active, i.active_phone_number, i.active_start_time, u.user_name FROM items i ' \
		'JOIN users u ON i.active_phone_number = u.phone_number ' \
		'WHERE item_id = {}'.format(item_id)
	rows, response = database.read(sql)
	
	if response == 'Success':
		# If there's a row resulting from the JOIN (and as a safety check, the status should always be active
		#   in that case) AND status has been active for less than 24 hours, then we are indeed active.  
		if len(rows) == 1  and  rows[0][0] == 1  and  (datetime.now().timestamp() - rows[0][2].timestamp()) / (60 * 60) < 24:
			response = {
				'code': 200,
				'status': {
					'active': 'true',
					'reserved': 'false',
					'phone_number': rows[0][1],
					'user_name': rows[0][3]
				}
			}
		else:
			sql = 'SELECT u.phone_number, u.user_name FROM reservations r ' \
				'JOIN users u ON r.phone_number = u.phone_number WHERE item_id = {} AND date = DATE(NOW());' \
				.format(item_id)
			rows, response = database.read(sql)

			if response == 'Success' :
				if len(rows) == 1:
					response = {
						'code': 200,
						'status': {
							'active': 'true',
							'reserved': 'true',
							'phone_number': rows[0][0],
							'user_name': rows[0][1]
						}
					}
				else:
					response = {
						'code': 200,
						'status': {
							'active': 'false',
							'reserved': 'false',
							'phone_number': '',
							'user_name': ''
						}
					}
			else:
				response = {'code': 500, 'message': 'status.py:get - ' + response}
	else:
		response = {'code': 500, 'message': 'status.py:get - ' + response}

	return response


def set(request):
	status = request.get_json()
	if status['active'] == 'true':
		sql = 'UPDATE items SET active=true, active_phone_number="{}", active_start_time="{}" WHERE item_id = {};' \
			.format(status['phone_number'], str(datetime.now()), status['item_id'])
	else:
		sql = 'UPDATE items SET active=false, active_phone_number=null, active_start_time=null WHERE item_id = {};' \
			.format(status['item_id'])
	response, _ = database.insert_update_delete(sql)
	
	if response == 'Success':
		response = {'code': 200}
	else:
		response = {'code': 500, 'message': 'status.py:set - ' + response}

	return response
