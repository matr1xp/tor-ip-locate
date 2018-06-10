#!/usr/bin/env python
import os
import pycurl
import io
import json
import pycountry
import stem.process
import string, re
import socket

from stem.control import Controller
from flask import Flask, Markup, url_for, request, render_template

SOCKS_PORT = 7000

def countries():
  """
  Creates a dictionary of Country Code and Country Names
  """
  cc={}
  for country in list(pycountry.countries):
     cc[country.alpha_2]=country.name

  return cc
  
def query(url):
  """
  Uses pycurl to fetch a site using the proxy on the SOCKS_PORT.
  """

  output = io.BytesIO()

  query = pycurl.Curl()
  query.setopt(pycurl.URL, url)
  query.setopt(pycurl.PROXY, 'localhost')
  query.setopt(pycurl.PROXYPORT, SOCKS_PORT)
  query.setopt(pycurl.PROXYTYPE, pycurl.PROXYTYPE_SOCKS5_HOSTNAME)
  query.setopt(pycurl.WRITEFUNCTION, output.write)
  
  # Warning: Code below is vulnerable to man-in-middle attack!
  query.setopt(pycurl.SSL_VERIFYPEER, 0)
  query.setopt(pycurl.SSL_VERIFYHOST, 0)
  
  try:
    query.perform()
    return output.getvalue()
  except pycurl.error as exc:
    return "Unable to reach %s (%s)" % (url, exc)

def query2(url):
  output = io.BytesIO()
  query = pycurl.Curl()
  query.setopt(pycurl.URL, url)
  query.setopt(pycurl.WRITEFUNCTION, output.write)
  
  # Warning: Code below is vulnerable to man-in-middle attack!
  query.setopt(pycurl.SSL_VERIFYPEER, 0)
  query.setopt(pycurl.SSL_VERIFYHOST, 0)
  try:
    query.perform()
    return output.getvalue()
  except pycurl.error as exc:
    return "Unable to reach %s (%s)" % (url, exc)
    

def get_info(anonymize = False, ip = ''):
  if anonymize == True :
    tor_process = stem.process.launch_tor_with_config(
      config = {
        'SocksPort': str(SOCKS_PORT)
      }
    )
    
  info = {}
  
  try:
    if anonymize == True:
      json_str = query("http://ipinfo.io/%s" % ip)
    else:
      json_str = query2("http://ipinfo.io/%s" %ip)
    
    print str(json_str)
    info = json.loads(str(json_str))
    try:
      info['country_name'] = countries()[info['country']]
      info['location_title'] = (info['city'] + ', ' if len(info['city']) > 0 else '') + (info['region'] + ' ' if len(info['region']) > 0 else '')
      info['map'] = Markup("<img src='https://maps.googleapis.com/maps/api/staticmap?center=" +  info['loc'] + "&zoom=12&size=640x640&maptype=hybrid&markers=color:0x39FF14|" + info['loc'] +"' class='map' alt='" + info['location_title'] +"' title='" + info['location_title'] + "'>")
      info['lat'] = info['loc'].split(',')[0]
      info['long'] = info['loc'].split(',')[1]
      info['zoomlevel'] = 12
      if re.search('no hostname', info['hostname'], re.IGNORECASE):
        try:
          info['hostname'] = socket.gethostbyaddr(info['ip'])[0]
        except socket.herror as exc:
          print "Unknown host"
          
    except KeyError as exc:
      print "Unable to get location data: %s" % str(json_str)
      #info['404'] = True
      info['hostname'] = ''
      info['loc'] = '0,0'
      info['location_title'] = 'Unknown location'
      info['country_name'] = ''
      info['org'] = ''
      info['post'] = ''
      info['lat'] = '0'
      info['long'] = '0'
      info['zoomlevel'] = 1
      
  except ValueError as exc:
    if anonymize == True :
      tor_process.kill()   
    
    print "Unable to get location data: %s" % str(json_str)
    info['loc'] = '0,0'
   
  if anonymize == True :
    tor_process.kill()   
  
  return info

app = Flask(__name__)

@app.route('/')
def index():
  title = "Welcome - Traveller"
  return render_template('index.html', **locals())

@app.route('/map', methods=['POST', 'GET'])
def map():
  try:
    if request.method == 'POST':
      qry = request.form['query']
      try:
        socket.inet_aton(qry)
      except socket.error:
        try:
          qry = socket.gethostbyname(qry)
        except socket.gaierror:
          qry = '0.0.0.0'
          
      info = get_info(False, qry)

    else:
      info = get_info(False)
      
    return render_template('map.html', data=info)
  except TypeError as exc:
      return str(info)
     
@app.route('/tor', methods=['POST', 'GET'])
def tor():
  try:
    if request.method == 'POST':
      qry = request.form['query']
      try:
        socket.inet_aton(qry)
      except socket.error:
        qry = socket.gethostbyname(qry)
       
      info = get_info(True, qry)

    else:
      info = get_info(True)
      
      return render_template('map.html', data=info)
  except TypeError as exc:
      return str(info)

key_path = os.path.expanduser('~/my_service_key')

with Controller.from_port() as controller:
  controller.authenticate('bHb2Lutk1Y63SnvX') # Enter your TOR service password here

  if not os.path.exists(key_path):
    service = controller.create_ephemeral_hidden_service({80: 5000}, await_publication = True)
    print("Started a new hidden service with the address of %s.onion" % service.service_id)

    with open(key_path, 'w') as key_file:
      key_file.write('%s:%s' % (service.private_key_type, service.private_key))
  else:
    with open(key_path) as key_file:
      key_type, key_content = key_file.read().split(':', 1)

    service = controller.create_ephemeral_hidden_service({80: 5000}, key_type = key_type, key_content = key_content, await_publication = True)
    print("Resumed %s.onion" % service.service_id)

  try:
    app.run()
  finally:
    print(" * Shutting down our hidden service")
