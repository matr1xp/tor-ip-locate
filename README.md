# NET Locator

This is an IP address/Domain name geo-locator implemented as a hidden web service using
[Tor's Stem Controller API](https://stem.torproject.org/api/control.html). 

It uses 
[Python Flask](http://flask.pocoo.org/) 
micro-framework and 
[Google Maps](https://developers.google.com/maps/documentation/javascript/)
API.
 
## Setup

A TOR relay is required. This is a complex setup but you can find instructions 
[here](https://www.torproject.org/docs/tor-doc-relay.html.en).

It is recommended to use Python's 
[virtualenv](https://pypi.python.org/pypi/virtualenv)
tool during development. 

See 
[README-flask.md](/README-flask.md) 
for more details.

### Running the service

The application is started using 
[PM2 Node.js](http://pm2.keymetrics.io/)
process manager. This ensures it is always up and running.
```
pm2 start application.py --name="tor-ip-locate"
```
Browse the site using
[TOR browser](https://www.torproject.org/projects/torbrowser.html.en) 
and point to its persistent *.onion address.

![Screenshot of Application](https://github.com/matr1xprogrammer/tor-ip-locate/blob/master/Screenshot.png)

### Dependencies

Relies on IP Address service located at http://ipinfo.io/


