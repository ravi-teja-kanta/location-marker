//@ts-check
var map, drawingManager;
var geoJson;
function initMap() {
        // var google = new google;
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 28.4595, lng: 77.0266},
          zoom: 8
        });
        drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon']
          }
        });
        drawingManager.setMap(map);

        google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {
            // assuming you want the points in a div with id="info"
            let currPolygon = [];
            for (var i = 0; i < polygon.getPath().getLength(); i++) {
                
                currPolygon.push([polygon.getPath().getAt(i).lat(), polygon.getPath().getAt(i).lng()]);
                
            }
            geoJson = {
                type: "Feature",
                geometry: {
                        "type": "Polygon",
                        "coordinates": [currPolygon]
                }
            };
            console.log(currPolygon);
        });
        
    }
    function go() {
        callBackend({
            locationName: document.getElementById("locationName").value,
            geoJson
        });
    }
    function callBackend(data) {
        console.log(data);
        const url = "http://localhost:3000/location/addNew";
        let options = {
            method: "POST",
            headers: {
                "Content-Type":"application/x-www-form-urlencoded"
            },
            body: JSON.stringify(data),
            mode: "no-cors"
        };
        fetch(url, options)
            // .then(data=>data.json())
            .then(res=>{
                console.log(res)
            })
            .catch(err=>console.log(err));
    }
    