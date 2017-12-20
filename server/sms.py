import os

from twilio.rest import Client

def send(recipient, message):
  twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
  twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
  twilio_number = os.environ.get('TWILIO_NUMBER')

  if not all([twilio_account_sid, twilio_auth_token, twilio_number]):
    print('Required enviroment variables TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_NUMBER missing')
    return

  client = Client(twilio_account_sid, twilio_auth_token)
  message = client.messages.create(to=recipient, from_=twilio_number, body=message)

