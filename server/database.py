import MySQLdb


USER = 'anyshare'
PASSWORD = 'anyshare_password'
DATABASE = 'anyshare'


def insert_update_delete(sql):
	db = MySQLdb.connect('localhost', USER, PASSWORD, DATABASE)
	cursor = db.cursor()

	response = ''
	rows_updated = 0
	try:
		cursor.execute(sql)
		db.commit()
		response = 'Success'
		rows_updated = cursor.rowcount
	except Exception as err:
		db.rollback()
		response = 'database.py:insert_update_delete - ' + str(err)
		print(response)
		
	db.close()
	return response, rows_updated


def read(sql):
	db = MySQLdb.connect('localhost', USER, PASSWORD, DATABASE)
	cursor = db.cursor()

	rows = ()
	response = ''
	try:
		cursor.execute(sql)
		rows = cursor.fetchall()
		response = 'Success'
	except Exception as err:
		response = 'database.py:read - ' + str(err)
		print(response)
	
	db.close()
	return rows, response


'''

DELIMITER $$
CREATE PROCEDURE create_user(p_phone_number VARCHAR(20), p_user_name VARCHAR(20), p_validation_code VARCHAR(10))
BEGIN
INSERT INTO users (phone_number, user_name) VALUES (p_phone_number, p_user_name) ON DUPLICATE KEY UPDATE user_name=p_user_name;
INSERT INTO validation_codes (phone_number, validation_code, expire_time) VALUES (p_phone_number, p_validation_code, DATE_ADD(NOW(), INTERVAL 1 HOUR));
END $$
DELIMITER ; $$

DELIMITER $$
CREATE PROCEDURE item_add(p_name VARCHAR(30), p_phone_number_owner VARCHAR(20))
BEGIN
DECLARE r_item_id INT;
INSERT INTO items (name, phone_number_owner, active) VALUES (p_name, p_phone_number_owner, FALSE);
SET r_item_id = LAST_INSERT_ID();
INSERT INTO items_users (item_id, phone_number) VALUES (r_item_id, p_phone_number_owner);
END $$
DELIMITER ; $$

DELIMITER $$
CREATE PROCEDURE item_delete(p_item_id INT)
BEGIN
DELETE FROM items WHERE item_id = p_item_id;
DELETE FROM items_users WHERE item_id = p_item_id;
END $$
DELIMITER ; $$



CREATE TABLE users
(
phone_number VARCHAR(20) NOT NULL,
user_name VARCHAR(20) NOT NULL,
create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY(phone_number)
);

CREATE TABLE validation_codes
(
phone_number VARCHAR(20) NOT NULL,
validation_code VARCHAR(5) NOT NULL,
expire_time DATETIME NOT NULL,
PRIMARY KEY(phone_number, validation_code)
);

CREATE TABLE reservations
(
item_id INT NOT NULL,
date DATE NOT NULL,
phone_number VARCHAR(20) NOT NULL,
create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY(item_id, date)
);

CREATE TABLE items
(
item_id INT NOT NULL AUTO_INCREMENT,
name VARCHAR(30) NOT NULL,
phone_number_owner VARCHAR(20) NOT NULL,
active BOOLEAN NOT NULL,
active_phone_number VARCHAR(20),
active_start_time DATETIME,
PRIMARY KEY(item_id)
);

CREATE TABLE items_users
(
	item_id INT NOT NULL,
	phone_number VARCHAR(20) NOT NULL,
	PRIMARY KEY(item_id, phone_number)
);


TODO - housekeeping work to do:
- job that deletes past date reservations
- job that deletes old validation codes

'''