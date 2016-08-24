(function() {

  // Our Google map.
  var map;

          var enclosingObjects = [];
	  var centralElev = null;

  var deg2rad = function(angle) {
    return (angle / 180) * Math.PI;
  }

  var rad2deg = function(rad) {
    return (rad * 180) / Math.PI;
  }

  // calculate destination lat/lon given a starting point, bearing, and distance (in m)
  var destination = function(lat, lon, bearing, distance) {
    var radius = 6378137;
    var rLat = deg2rad(lat);
    var rLon = deg2rad(lon);
    var rBearing = deg2rad(bearing);
    var rAngDist = distance / radius;

    rLatB = Math.asin((Math.sin(rLat) * Math.cos(rAngDist)) + (Math.cos(rLat) * Math.sin(rAngDist) * Math.cos(rBearing)));

    rLonB = rLon + Math.atan2(Math.sin(rBearing) * Math.sin(rAngDist) * Math.cos(rLat), Math.cos(rAngDist) - Math.sin(rLat) * Math.sin(rLatB));

    return {
      "lat": rad2deg(rLatB), 
      "lng": rad2deg(rLonB)
    };
  }

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
    var rectangle;

    map.addListener('click', function(coords) {
      var point = ee.Geometry.Point(coords.latLng.lng(), coords.latLng.lat());
      console.log("point1="+point);

      var meanDictionary = image.reduceRegion(ee.Reducer.mean(), point, 30);
      var statement = meanDictionary.get("elevation");
      if (state == 0) {
        point1 = point;
        point2 = null;
        if(flightPath != null) {
          flightPath.setPath([]);
        }

	var meanDictionary1 = image.reduceRegion(ee.Reducer.mean(), point, 30);
	var statement1 = meanDictionary1.get("elevation");
	statement1.evaluate(function(val) {
	    centralElev=val;
	    $("#elevation1").val(val);
	    state = 1;
	  });


      } else {

        point2 = point;
        point1.distance(point2).evaluate(function(val) {
          var positionObj;
          var interval = 2*val / 10;

          var apart;

          var pointRadius = interval/2;

          var latLngArray = [];

          for(var distance = val; distance > 0; distance -= interval) {
            var circumference = 2 * Math.PI * distance;
            var numberOfIterations = Math.round(circumference / (pointRadius * 2))
	      
	      console.log("distance="+distance);

            apart = 360 / numberOfIterations;

            for(var deg = 0; deg <= 360-apart/2; deg += apart) {
	      (function(){
		var distanceLocal=distance;
		var pointRadiusLocal = pointRadius;

              var positionObj = destination(point1.coordinates_[1], point1.coordinates_[0], deg, distance);
	      
	      var pointObj=ee.Geometry.Point(positionObj["lng"],positionObj["lat"]);


//              enclosingObjects.push(enclosingObject);
  //            latLngArray.push([positionObj.lng, positionObj.lat]);

	      var meanDictionary = image.reduceRegion(ee.Reducer.mean(), pointObj, 30);
	      var statement = meanDictionary.get("elevation");
	      statement.evaluate(function(val) {
		  
		  var elevDiff=centralElev-val;
		  console.log("centralElev="+centralElev+"|"+pointObj.coordinates_[1]+","+pointObj.coordinates_[0]+"| elev="+val);
		  ajaxUri = "http://localhost:8888/?vol=" + $("#volume").val() 
		    + "&elevationDiff=" + elevDiff 
		    + "&distance=" + distanceLocal 
		    + "&lat=" + pointObj.coordinates_[1]
		    + "&lng=" + pointObj.coordinates_[0]
		    + "&data=" + $("#data").val();

		  $.ajax({
		    url: ajaxUri,
			data: {},
			success: function(data){
			var probability = data.probability;// * 100;
			var co = 'rgb('+Math.floor(Math.min(1,2*probability)*255)+', '+Math.floor(Math.min(1,2-2*probability)*255)+', 0)';
//			console.log("at="+pointObj.coordinates_[1]+","+pointObj.coordinates_[0]+" , rad="+pointRadiusLocal+", p="+ probability);
			console.log("at="+parseFloat(data.lng)+","+parseFloat(data.lat)+", rad="+pointRadiusLocal+", p="+ probability+", co="+co);

			var visualization = new google.maps.Circle({
			  strokeOpacity: 1,
			      strokeWeight: 0,
			      fillColor: co,
			      fillOpacity: 0.45, 
//			      center: {
	//		    'lat': pointObj.coordinates_[1], 
		//		'lng': pointObj.coordinates_[0]
			//	},
			      center: {
			    'lat': parseFloat(data.lat), 
				'lng': parseFloat(data.lng)
				},
			      radius: pointRadiusLocal
			      });
			
			var enclosingObject = {
			position: positionObj,
			visualization: visualization
			}
			
			enclosingObjects.push(enclosingObject);
			
			visualization.setMap(map);
  		
	
			
//			$("#probability").html(probability + "%");
		      },
			error: function() {
//			alert("Sorry, there was an error!")
			  }
		    });
		  
		});
	      })();
            }
          }
//          console.log("latLngArray: ");
  //        console.log(latLngArray.length);
    //      console.log("-");
	  /*         var multiPointData = ee.Geometry.MultiPoint(latLngArray);
          image.reduceRegion(ee.Reducer.histogram(), multiPointData, 30).evaluate(function(multiPointList){
            console.log("toList output 1 -");
            console.log(multiPointList);
            console.log("-");
          });

          console.log(enclosingObjects);

          $("#distance").val(Math.round(val * 1000) / 1000);*/
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

	/*
	  var regionGeo = ee.Geometry.MultiPoint([point1.coordinates_[0], point1.coordinates_[1], point2.coordinates_[0], point2.coordinates_[1]]);
	  image.reduceRegion(ee.Reducer.toList(), regionGeo, 30).evaluate(function(val){
          console.log("toList output -");
          console.log(val);
          console.log("-");
	  });
	*/
        /*
	  if(rectangle == null) {
          rectangle = new google.maps.Rectangle({
	  strokeColor: '#FF0000',
	  strokeOpacity: 0.8,
	  strokeWeight: 2,
	  fillColor: '#FF0000',
	  fillOpacity: 0.35
          });
	  }
	  
	  rectangle.setBounds({
          north: Math.max(point2.coordinates_[1], point1.coordinates_[1]),
          south: Math.min(point1.coordinates_[1], point2.coordinates_[1]),
          east: Math.max(point2.coordinates_[0], point1.coordinates_[0]),
          west: Math.min(point2.coordinates_[0], point1.coordinates_[0])
	  });
	  
	  rectangle.setMap(map);
        */
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
          center: { lat: 49.40755, lng: -122.93791},
          zoom: 15,
          mapTypeId: 'satellite'
        });

    $("#calc_button").click(function(){
      ajaxUri = "http://localhost:8888/?lat=0&lng=0&vol=" + $("#volume").val() + "&elevationDiff=" + $("#elevationDiff").val() + "&distance=" + $("#distance").val() + "&data=" + $("#data").val();
      $("#debuginfo").val(ajaxUri)

      $.ajax({
        url: ajaxUri,
        data: {},
        success: function(data){
          var probability = data.probability * 100;

          $("#probability").html(probability + "%");
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
