from datetime import datetime

import database


def check(start_date, end_date):
	sql = 'SELECT COUNT(*) FROM reservations WHERE date BETWEEN "{}" AND "{}";' \
		.format(start_date, end_date)
	rows, response = database.read(sql)

	if response == 'Success':
		# if COUNT(*) equals 0, then no reservations exist between those start and end dates
		if rows[0][0] == 0:		
			response = {'code': 200, 'availability': 'true'}
		else:
			response = {'code': 200, 'availability': 'false'}
	else:
		response = {'code': 500, 'message': 'availability.py:check - ' + response}

	return response