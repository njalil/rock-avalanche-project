(function() {

  // Our Google map.
  var map;

  var flightPath;
  var image;
  var updateElevationsDistance = function(els) {
    var el1 = null;
    var el2 = null;
    if(els[0] != null) {
      el1 = parseFloat(els[0]);
      $("#elevation1").val(el1);
    } else {
      $("#elevation1").val("");
    }
    if(els[1] != null) {
      el2 = parseFloat(els[1]);
      $("#elevation2").val(el2);
    } else {
      $("#elevation2").val("");
    }

    if((el1 != null) && (el2 != null)) {
      var difference = Math.abs(el1 - el2);
      $("#elevationDiff").val(difference);
    }
    
  }
  // Runs a simple EE analysis and output the results to the web page.
  var runAnalysis = function() {
    ee.initialize();
    image = ee.Image('USGS/SRTMGL1_003');
    var elevations = [null, null];
    var state = 0;
    var point1, point2;

    map.addListener('click', function(coords) {
      var point = ee.Geometry.Point(coords.latLng.lng(), coords.latLng.lat());
      var meanDictionary = image.reduceRegion(ee.Reducer.mean(), point, 30);
      var statement = meanDictionary.get("elevation");
      if (state == 0) {
        point1 = point;
        point2 = null;
        state = 1;
        if(flightPath != null) {
          flightPath.setPath([])
        }
      } else {
        point2 = point;
        point1.distance(point2).evaluate(function(val) {
          $("#distance").val(Math.round(val * 1000) / 1000);
        });

        if(flightPath == null) {
          flightPath = new google.maps.Polyline({
            geodesic: true,
            strokeColor: '#D8B60B',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          flightPath.setMap(map);
        }

        var flightPlanCoordinates = [
          {lat: point1.coordinates_[1], lng: point1.coordinates_[0]},
          {lat: point2.coordinates_[1], lng: point2.coordinates_[0]}
        ];
        flightPath.setPath(flightPlanCoordinates);

        state = 0;
      }
      statement.evaluate(function(val) {
       if(elevations[0] == null) {
        elevations[0] = val;
        elevations[1] = null;
       } else if(elevations[1] == null) {
        elevations[1] = val;
       } else {
        elevations[0] = val;
        elevations[1] = null;
       }
       updateElevationsDistance(elevations);
      })
    });

  };

  $(document).ready(function() {
    // Create the base Google Map.
    map = new google.maps.Map($('.map').get(0), {
          center: { lat: 49.2827, lng: -123.1207},
          zoom: 5
        });

    $("#calc_button").click(function(){
      ajaxUri = "http://localhost:8888/?vol=" + $("#volume").val() + "&elevationDiff=" + $("#elevationDiff").val() + "&distance=" + $("#distance").val() + "&data=" + $("#data").val();

      $.ajax({
        url: ajaxUri,
        data: {},
        success: function(data){
          $("#probability").html(data.probability);
        },
        error: function() {
          alert("Sorry, there was an error!")
        }
      });
    });

    // Shows a button prompting the user to log in.
    var onImmediateFailed = function() {
      $('.g-sign-in').removeClass('hidden');
      $('.output').text('(Log in to see the result.)');
      $('.g-sign-in .button').click(function() {
        ee.data.authenticateViaPopup(function() {
          // If the login succeeds, hide the login button and run the analysis.
          $('.g-sign-in').addClass('hidden');
          runAnalysis();
        });
      });
    };

    // Attempt to authenticate using existing credentials.
    ee.data.authenticate(CLIENT_ID, runAnalysis, null, null, onImmediateFailed);
  });
})();
