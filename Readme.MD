# Rock Avalanche Project #

This is an application aimed towards predicting the probability of a landslide given two points on a Google Map using Google Earth Engine elevation data. It uses a linear model for learning historical data on landslides and uses that model to predict the probability. The learning algorithm has been implemented in R; the back-end is implemented in Python which calls the learning algorithm through Python `subprocess`; the front-end is implemented in JS, using Google Earth Engine API.

*Please note that this is an alpha stage application, still undergoing development*

### Run it locally ###

- Intall dependencies
- Add client ID to `app.js` from Google Developer Console 
- Add URL to backend to `config.js` - by default it is `http://localhost:8888/`
- Run `python -m SimpleHTTPServer 8080` inside the `www` folder from bash/Terminal (This will start serving the front end on port 8080; you can change the port to whatever you like)
- Run `python probability_calculation.py` in the root folder from bash/Terminal
- Navigate to `http://localhost:8080/` and use the app (given the front end is running on port 8080 from the third step)

