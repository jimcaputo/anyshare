import json
from random import randint

import database
import sms


# Returns list of all users.  DEBUG MODE ONLY!!
def get():
	sql = 'SELECT user_name, phone_number FROM users ORDER BY user_name;'
	rows, response = database.read(sql)

	if response == 'Success':
		users = []

		for row in rows:
			users.append({
				'user_name': row[0],
				'phone_number': row[1]
			})
		response = {'code': 200, 'users': users}
	else:
		response = {'code': 500, 'message': 'users.py:get - ' + response}

	return response


def create(request):
	user = request.get_json()
	validation_code = randint(1001, 9999)
	sql = 'CALL create_user("{}", "{}", "{}");'.format(user['phone_number'], user['user_name'], validation_code)
	response, _ = database.insert_update_delete(sql)

	# If a new row is created, or if one already exists (meaning, the user is simply setting up the app again, 
	#   but they already have an account), then we send them a Validation Code
	# TODO - IMPORTANT NOTE - This is a bad hole that would need to be patched.  We are blindly updating the user
	#   name even if the person does not validate that they own the phone number.  That means anyone can update
	#   anyone else's user name simply by clicking Submit, but not following through on validation.  To fix, we 
	#   should store the new user name in the validation_codes table and then apply an update when the user 
	#   successfully validates via the registration flow. 
	if response == 'Success':
		print('Validation Code: ' + str(validation_code))
		sms.send('+1' + user['phone_number'], 'Anything Shared validation code: {}'.format(validation_code))
		response = {'code': 200}
	else:
   		response = {'code': 500, 'message': 'users.py:create - ' + response}
 
	return response
	

def validate(request):
	user = request.get_json()
	sql = 'SELECT validation_code FROM validation_codes WHERE phone_number = "{}" AND validation_code = "{}";' \
		.format(user['phone_number'], user['validation_code'])
	rows, response = database.read(sql)

	if response == 'Success':
		if len(rows) == 1:
			response = {'code': 200}
		else:
			response = {'code': 404, 'message': 'Incorrect validation code'}	
	else:
   		response = {'code': 500, 'message': 'users.py:validate - ' + response}
 
	return response


# TODO's
# - malicious user could send text message spam via our app.  need to cache something unique about the phone
#   such as a "mac address" and prevent multiple calls to the registration api
