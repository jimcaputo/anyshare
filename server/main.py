import json
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS

import database
import items
import items_users
import reservations
import status
import users

app = Flask(__name__)
CORS(app)


@app.route('/')
def http_home():
    return 'Anything Shared!'

@app.route('/web/<file_name>')
def http_web(file_name):
    f = open('../web/' + file_name, 'r')
    if 'css' in file_name:
        return Response(f.read(), mimetype='text/css')
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


# DELETE - Deletes a user from a given item
@app.route('/items_users/<item_id>/<phone_number>', methods=['DELETE'])
def http_items_users_delete(item_id, phone_number):
    try:
        response = items_users.delete(item_id, phone_number)
    except Exception as err:
        response = {'code': 500, 'message': 'main.py:items_users_delete - ' + str(err)}
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



# This is used when running locally
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
    #app.run(host='127.0.0.1', port=8080, debug=True)


# Command line to run with gunicorn
#   gunicorn -w 24 -b 0.0.0.0:8080 --log-level=debug main:app



