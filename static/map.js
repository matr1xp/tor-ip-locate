// map center
var center = new google.maps.LatLng(parseFloat(geodata.lat), parseFloat(geodata.long));
// marker position
var factory = new google.maps.LatLng(parseFloat(geodata.lat), parseFloat(geodata.long));
var theMap;
var theMarker;
var theInfowindow;

function initialize() {
    console.debug("Map initialize start...");
    var mapOptions = {
        center: center,
        zoom: geodata.zoomlevel,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    theMap = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);
    // InfoWindow content
    console.debug("geodata", geodata);
    var content = '<div id="iw-container">' +
                    '<div class="iw-title">'+ geodata.ip +'</div>' +
                    '<div class="iw-content">' +
                    (geodata.location_title.length > 0 ? '<div class="iw-subTitle">' + geodata.location_title : '<div class="iw-subTitle">') +
                    ' ' + geodata.country_name + '</div>' + 
                    (geodata.hostname.length > 0 && !geodata.hostname.match(/no hostname/i) ? '<p>Host: <span style="color:navy;"><a href="http://' + geodata.hostname + '" target="_blank">' + geodata.hostname + '</a></span><br/>' : '<p>') +
                    (geodata.org.length > 0 ? 'Org: ' + geodata.org + '<br/>' : '') +
                    (geodata.loc != '0,0' ? 'Lat: <span style="color:darkred;">' + geodata.lat + '</span>' + '&nbsp;&nbsp; Long: <span style="color:darkred;">' + geodata.long + '</span><br/>' : '') +
                    (geodata.postal ? 'Postal: ' + geodata.postal + '<br/>' : '') +
                    '</p>'+
                      '<p style="width: 350px;"></p>' +
                      '<p><br>'+
                      '<br></p>'+
                    '</div>' +
                    '<div class="iw-bottom-gradient"></div>' +
                  '</div>';

    // A new Info Window is created and set content
    theInfowindow = new google.maps.InfoWindow({
        content: content,
        // Assign a maximum value for the width of the infowindow allows
        // greater control over the various content elements
        maxWidth: 350
    });
    // marker options
    theMarker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        position: factory,
        map: theMap,
        title: geodata.ip
    });
    
    // This event expects a click on a marker
    // When this event is fired the Info Window is opened.
    google.maps.event.addListener(theMarker, 'click', function() {
        console.debug('Marker clicked');
        theInfowindow.open(theMap, theMarker);
    });
    
    // Event that closes the Info Window with a click on the map
    google.maps.event.addListener(theMap, 'click', function() {
        theInfowindow.close();
    });

  // *
  // START INFOWINDOW CUSTOMIZE.
  // The google.maps.event.addListener() event expects
  // the creation of the infowindow HTML structure 'domready'
  // and before the opening of the infowindow, defined styles are applied.
  // *
  google.maps.event.addListener(theInfowindow, 'domready', doInfoWindowStyle);
  
  function doInfoWindowStyle() {
    console.debug("InfoWindow domready");
      
    // Reference to the DIV that wraps the bottom of infowindow
    var iwOuter = $('.gm-style-iw');

    /* Since this div is in a position prior to .gm-div style-iw.
     * We use jQuery and create a iwBackground variable,
     * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
    */
    var iwBackground = iwOuter.prev();

    // Removes background shadow DIV
    iwBackground.children(':nth-child(2)').css({'display' : 'none'});

    // Removes white background DIV
    iwBackground.children(':nth-child(4)').css({'display' : 'none'});

    // Moves the infowindow 115px to the right.
    iwOuter.parent().parent().css({left: '115px'});

    // Moves the shadow of the arrow 76px to the left margin.
    iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 76px !important;'});
    
    // Moves the arrow 76px to the left margin.
    iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;'});
   
    // Changes the desired tail shadow color.
    iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});

    // Reference to the div that groups the close button elements.
    var iwCloseBtn = iwOuter.next();

    // Apply the desired effect to the close button
    iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});
    iwCloseBtn.css({'display': 'none'});

    // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
    if($('.iw-content').height() < 140){
      $('.iw-bottom-gradient').css({display: 'none'});
    }

    // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
    iwCloseBtn.mouseout(function(){
      $(this).css({opacity: '1'});
    });
    
  };

  /*google.maps.event.addListenerOnce(theMap, 'idle', function() {
    console.log("idle triggered");
    google.maps.event.trigger(theMarker, 'click');
  });*/
}

google.maps.event.addDomListener(window, 'load', initialize);

function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
}

function geocodeLatLng(geocoder, latlng) {
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === 'OK') {
      if (results[0]) {
        console.debug('Geocode', results);
        var content;
        content = "<p class='more_less'><a id='more_less' href='#geocode'>More...</a></p>";
        content += "<div class='hide' id='more_info'>Reverse geocode information:<br/></div>"
        //document.getElementById('more-content').innerHTML = content;
        var el = document.getElementById("more_less");
        el.addEventListener("click", openMore, false);
      } else {
        console.debug('No results found');
      }
    } else {
      console.error('Geocoder failed due to: ', status);
    }
  });
}

