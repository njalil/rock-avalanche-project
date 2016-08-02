### Rock Avalanche Project ###

This is an application aimed towards predicting the probability of a landslide given two points on a Google Map using Google Earth Engine elevation data. It uses a linear model for learning historical data on landslides and uses that model to predict the probability. The learning algorithm has been implemented in R; the back-end is implemented in Python which calls the learning algorithm through Python `subprocess`; the front-end is implemented in JS, using Google Earth Engine API.

*Please note that this is an alpha stage application, still undergoing development*

### Run it locally ###

- Intall dependencies
- Add client ID to `app.js` from Google Developer Console (set up an app with origin and redirect URLs as `http://localhost:8080`)
- Run `python -m SimpleHTTPServer 8080` inside the `www` folder from bash/Terminal
- Run `python probability_calculation.py` in the root folder from bash/Terminal
- Navigate to `http://localhost:8080/` and use the app

