import json
from random import randint

import database
import sms


def get(phone_number):
	if phone_number != None:
		sql = 'SELECT user_name, phone_number FROM users WHERE phone_number = {}'.format(phone_number)
	rows, response = database.read(sql)

	if response == 'Success':
		if len(rows) == 1:
			user = {
				'user_name': rows[0][0],
				'phone_number': rows[0][1]
			}
			response = {'code': 200, 'user': user}
		else:
			response = {'code': 404, 'message': 'Phone number does not exist'}
	else:
		response = {'code': 500, 'message': 'users.py:get - ' + response}

	return response


def create(request):
	user = request.get_json()
	validation_code = randint(1001, 9999)
	sql = 'CALL create_user("{}", "{}");'.format(user['phone_number'], validation_code)
	response = database.insert_update_delete(sql)

	if response == 'Success':
		print('Validation Code: ' + str(validation_code))
		sms.send('+1' + user['phone_number'], 'AnyShare Verification Code: {}'.format(validation_code))
		response = {'code': 200}
	else:
   		response = {'code': 500, 'message': 'users.py:create - ' + response}
 
	return response
	

def update(request):
	user = request.get_json()
	if 'validation_code' in user:
		sql = 'SELECT validation_code FROM validation_codes WHERE phone_number = "{}" AND validation_code = "{}";' \
			.format(user['phone_number'], user['validation_code'])
		rows, response = database.read(sql)

		if response == 'Success':
			if len(rows) == 1:
				response = {'code': 200}
			else:
				response = {'code': 404, 'message': 'Incorrect validation code'}	
		else:
	   		response = {'code': 500, 'message': 'users.py:update - ' + response}
	elif 'user_name' in user:
		sql = 'UPDATE users SET user_name = "{}" WHERE phone_number = "{}"'.format(user['user_name'], user['phone_number'])
		response = database.insert_update_delete(sql)
	
		if response == 'Success':
			response = {'code': 200}
		else:
	   		response = {'code': 500, 'message': 'users.py:update - ' + response}

	return response


# TODO's
# - malicious user could send text message spam via our app.  need to cache something unique about the phone
#   such as a "mac address" and prevent multiple calls to the registration api
