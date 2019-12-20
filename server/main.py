import json
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
import threading

import database
import items
import items_users
import notifications
import reservations
import status
import users

app = Flask(__name__)
CORS(app)


#############################################################################
# For DEBUG execution on local server only.
# On prod server, all of these requests should be handled by nginx
#############################################################################

@app.route('/')
def http_home():
    return http_web('anyshare.html')
@app.route('/<file_name>')
def http_root(file_name):
    if 'favicon.ico' in file_name:
        return http_media('favicon.png')
    return http_web(file_name)
@app.route('/web/<file_name>')
def http_web(file_name):
    f = open('../web/' + file_name, 'r')
    if 'css' in file_name:
        return Response(f.read(), mimetype='text/css')
    if 'js' in file_name:
        return Response(f.read(), mimetype='text/javascript')
    return f.read()
@app.route('/media/<file_name>')
def http_media(file_name):
    try:
        f = open('../web/media/' + file_name, 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    try:
        f = open('../web/media/default.jpg', 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    return ''
@app.route('/media/items/<file_name>')
def http_media_items(file_name):
    try:
        f = open('../web/media/items/' + file_name, 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    try:
        f = open('../web/media/default.jpg', 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    return ''
@app.route('/media/users/<file_name>')
def http_media_users(file_name):
    try:
        f = open('../web/media/users/' + file_name, 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    try:
        f = open('../web/media/default.jpg', 'rb')
        return f.read()
    except Exception as err:
        print(str(err))
    return ''

#############################################################################
#############################################################################


# GET - Returns list of items for current user
@app.route('/items/<phone_number>', methods=['GET'])
def http_items_get(phone_number):
    try:
        response = items.get(phone_number)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_get - ' + str(err)}
    return json.dumps(response), int(response['code'])


# POST - Creates a new item
@app.route('/items', methods=['POST'])
def http_items_create():
    try:
        response = items.create(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_create - ' + str(err)}
    return json.dumps(response), int(response['code'])


# DELETE - Deletes a given item
@app.route('/items/<item_id>', methods=['DELETE'])
def http_items_delete(item_id):
    try:
        response = items.delete(item_id)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_delete - ' + str(err)}
    return json.dumps(response), int(response['code'])


# Returns the current status (active / inactive) of the item
@app.route('/status/<item_id>', methods=['GET'])
def http_status_get(item_id):
    try:
        response = status.get(item_id)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:status_get - ' + str(err)}
    return json.dumps(response), int(response['code'])


# Sets the status to active or inactive for a given item
@app.route('/status', methods=['POST'])
def http_status_set():
    try:
        response = status.set(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:status_set - ' + str(err)}
    return json.dumps(response), int(response['code'])


# GET - Returns list of current reservations for a given item
@app.route('/reservations/<item_id>')
@app.route('/reservations/<item_id>/<start_date>/<end_date>', methods=['GET'])
def http_reservations_get(item_id, start_date=None, end_date=None):
    try:
        response =reservations.get(item_id, start_date, end_date)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:reservations_get - ' + str(err)}
    return json.dumps(response), int(response['code'])


# POST - Creates a new reservation
@app.route('/reservations', methods=['POST'])
def http_reservations_create():
    try:
        response = reservations.create(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:reservations_create - ' + str(err)}
    return json.dumps(response), int(response['code'])


# DELETE - Deletes an existing reservation
@app.route('/reservations/<item_id>/<date>', methods=['DELETE'])
def http_reservations_delete(item_id, date):
    try:
        response = reservations.delete(item_id, date)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:reservations_delete - ' + str(err)}
    return json.dumps(response), int(response['code'])


# GET - Returns list of users for a given item
@app.route('/items_users/<item_id>', methods=['GET'])
def http_items_users_get(item_id):
    try:
        response = items_users.get(item_id)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_users_get - ' + str(err)}
    return json.dumps(response), int(response['code'])


# POST - Adds a user to a given item
@app.route('/items_users', methods=['POST'])
def http_items_users_add():
    try:
        response = items_users.add(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_users_add - ' + str(err)}
    return json.dumps(response), int(response['code'])

# Patch - Currently only used for setting user_default
@app.route('/items_users', methods=['PATCH'])
def http_items_users_patch():
    try:
        response = items_users.update(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_users_patch - ' + str(err)}
    return json.dumps(response), int(response['code'])

# DELETE - Deletes a user from a given item
@app.route('/items_users/<item_id>/<phone_number>', methods=['DELETE'])
def http_items_users_delete(item_id, phone_number):
    try:
        response = items_users.delete(item_id, phone_number)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_users_delete - ' + str(err)}
    return json.dumps(response), int(response['code'])


# GET - Returns notifications for a given item_id and phone_number
@app.route('/notifications/<item_id>/<phone_number>', methods=['GET'])
def http_notifications_get(item_id, phone_number):
    try:
        response = notifications.get(item_id, phone_number)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:notifications_get - ' + str(err)}
    return json.dumps(response), int(response['code'])

# POST - Sets value for notifications
@app.route('/notifications', methods=['PATCH'])
def http_notifications_patch():
    try:
        response = notifications.update(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:notifications_post - ' + str(err)}
    return json.dumps(response), int(response['code'])


# GET - Returns list of users
@app.route('/users', methods=['GET'])       # Returns all users - should only be used in debug mode
@app.route('/users/<phone_number>', methods=['GET'])
def http_users_get(phone_number=None):
    try:
        response = users.get(phone_number)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:users_get - ' + str(err)}
    return json.dumps(response), int(response['code'])


# POST - Creates a new user, and sends registration code via SMS message
@app.route('/users', methods=['POST'])
def http_users_create():
    try:
        response = users.create(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:users_create - ' + str(err)}
    return json.dumps(response), int(response['code'])


# PATCH - Updates user account, either registration code or new username
@app.route('/users', methods=['PATCH'])
def http_users_update():
    try:
        response = users.update(request)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:users_update - ' + str(err)}
    return json.dumps(response), int(response['code'])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)


# Command line to run with gunicorn
#   gunicorn -w 24 -b 0.0.0.0:8080 --log-level=debug main:app



