$(document).ready(function() {

    // Because we need to be able to call localStorage and render lattest, global variables must be set to blank strings before an on-click event
    var cityName = "";
    var currentCityName = "";
    var currentTemperature = "";
    var currentHumidity = "";
    var currentWindSpeed = "";
    var currentIcon = "";
    var currentUVI = "";
    var lattestStoredCity = "";

    const currentDate = moment().format("ll"); 

    // Where previous searches will be stored and called
    var searchHistory = [];

    var searchHistoryEl = $("#search-history");
    var dashboardEl = $("#daily-weather");

    // Render search history from localStorage and render weather of lattest city searched
    loadStored();

    // Render weather from search input
    $("#search-btn").on("click", function(event) {
        event.preventDefault();

        var inputCityName = $("#search-value").val().trim();
        // console.log(inputCityName);
        cityName = inputCityName;

        emptyWeather();  
        renderWeather();

        $("#search-value").val("");
    });
    
    // If an element within #search-history is clicked, then "clicked" === true; thus, preventing re-rendering in localStorage and #search-history
    $("#search-history").click(function(){
            $(this).data("clicked", true);
        });

    // Render weather from search history
    $("#search-history").on("click", ".city", function(anotherEvent) {
        anotherEvent.preventDefault();
    
        // console.log("We are clicking on a city in the search history");
        var listCityName = $(this).data("city");
        // console.log(listCityName);
        cityName = listCityName;
        
        emptyWeather();
        renderWeather();
    }); 
    
    function loadStored() {
        // renderLatestInput();

        var storedCities = JSON.parse(localStorage.getItem("cities"));

        if (storedCities !== null) {
            searchHistory = storedCities;

            for (var i = 0; i < searchHistory.length; i++) {
                // console.log(searchHistory);
                // console.log(searchHistory[i]);
                var searchHistoryStorage = searchHistory[i];
                var cityFromStorage = searchHistoryStorage.newCity;
                // console.log(cityFromStorage);
                var historyListEl = $(`<li class="city" data-city="` + cityFromStorage + `">` + cityFromStorage + `</li>`);

                searchHistoryEl.prepend(historyListEl);
            }
        
            lattestStoredCity = searchHistory[searchHistory.length-1];
            console.log("The lattest city searched upon reload is: " + lattestStoredCity.newCity);
            cityName = lattestStoredCity.newCity;

            renderWeather();
        }
    }; 

    function emptyWeather() {
        dashboardEl.empty();
        $("#0-day-forecast").empty();
        $("#1-day-forecast").empty();
        $("#2-day-forecast").empty();
        $("#3-day-forecast").empty();
        $("#4-day-forecast").empty();
    };

    function renderWeather() {
        // This is our API key
        var APIKey = "166a433c57516f51dfab1f7edaed8413";
        // Here we are building the URL we need to query the initial database
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + APIKey;
        // console.log(queryURL);

        $.ajax({
        url: queryURL,
        method: "GET"
        })
        // We store all of the retrieved data inside of an object called "response". This will get us the latitude/longitude that will allow us to do another call for more detailed weather data.
        .then(function(response) {
            // console.log("The general weather response is", response);

            var latitude = response.coord.lat; 
            var longitude = response.coord.lon; 
            
            var oneCallURL = "https://api.openweathermap.org/data/2.5/onecall?lat="+ latitude + "&lon=" + longitude +"&exclude=minutely,hourly&appid=" + APIKey;

            $.ajax({
                url: oneCallURL,
                method: "GET"
            })
            //  Store all retrieved data in object "weatherResponse"
            .then(function(weatherResponse) {
            // console.log("A more broad and detailed weather response based on location is", weatherResponse);                

            currentCityName = response.name;
            var tempK = weatherResponse.current.temp;
            currentTemperature = ((tempK - 273.15) * 1.80 + 32).toFixed(2);
            currentHumidity = weatherResponse.current.humidity;
            currentWindSpeed = weatherResponse.current.wind_speed;
            currentIcon = "https://openweathermap.org/img/w/" + weatherResponse.current.weather[0].icon + ".png";
            currentIconAlt = weatherResponse.current.weather[0].description;
            currentUVI = weatherResponse.current.uvi;
            
            
            // Render dashboard
            var dashHeaderEl = $(`<h2>` + currentCityName + ` (` + currentDate +`) - <img SameSite="None" src="` + currentIcon + `" alt="` + currentIconAlt + `"></h2>`);
            var dashTemperatureEl = $(`<p>Temperature: ` + currentTemperature + `F </p>`);
            var dashHumidityEl = $(`<p>Humidity: ` + currentHumidity + `%</p>`);
            var dashWindSpeedEl = $(`<p>Wind Speed: ` + currentWindSpeed + ` MPH</p>`);
            var dashUVIEl = $(`<p>UV Index: ` + currentUVI + `</p>`); 
            var historyListEl = $(`<li class="city" data-city="` + currentCityName + `">` + currentCityName + `</li>`);

            dashboardEl.append(dashHeaderEl);
            dashboardEl.append(dashTemperatureEl);
            dashboardEl.append(dashHumidityEl);
            dashboardEl.append(dashWindSpeedEl);
            dashboardEl.append(dashUVIEl); 

            // Depending on UVI, class set as favorable/moderate/severe to change background-color
            dashUVIEl.attr("data-uvi", currentUVI);
            if (dashUVIEl.attr("data-uvi") >= 0 && dashUVIEl.attr("data-uvi") < 3) {
                dashUVIEl.addClass("favorable");
            } else if (dashUVIEl.attr("data-uvi") >= 3 && dashUVIEl.attr("data-uvi") < 6) {
                dashUVIEl.addClass("moderate");
            } else if (dashUVIEl.attr("data-uvi") >= 6) {
                dashUVIEl.addClass("severe");
            } 
            
            // Render 5-day forecast
            for (i = 0; i < weatherResponse.daily.length - 3; i++) {
                var forecastDate = moment().add(i, 'days').format("l");
                var forecastIcon = "https://openweathermap.org/img/w/" + weatherResponse.daily[i].weather[0].icon + ".png";
                var forecastIconAlt = weatherResponse.daily[i].weather[0].description;
                var forecastTempK = weatherResponse.daily[i].temp.day;
                var forecastTemperature = ((forecastTempK - 273.15) * 1.80 + 32).toFixed(2);
                var forecastHumidity = weatherResponse.daily[i].humidity;

                var forecastEl = $("#" + i + "-day-forecast");

                forecastEl.append(`<h3>` + forecastDate + `</h3>`);
                forecastEl.append(`<img SameSite="None" src="` + forecastIcon + `"alt="` + forecastIconAlt + `">`);
                forecastEl.append("<p>Temperature: " + forecastTemperature + "F </p>");
                forecastEl.append("<p>Humidity: " + forecastHumidity + "%</p>");
            };

            // If click on list element or page load, then return; else store new search in localStorage and push to searchHistory array
            if ($("#search-history").data("clicked") || cityName === lattestStoredCity.newCity) {
                return;
            } else {
                // Return from function if no new city is added
                if ($("#search-history").val === "") {
                    return;
                }
                
                // Render newest search to #search-history
                var historyListEl = $(`<li class="city" data-city="` + currentCityName + `">` + currentCityName + `</li>`);
                searchHistoryEl.prepend(historyListEl);
                        
                // Store city in localStorage (pushed to searchHistory array)
                var newCity = currentCityName;
                var newCityObject = {newCity: newCity, };

                searchHistory.push(newCityObject);
                localStorage.setItem("cities", JSON.stringify(searchHistory));
            };

        }) 

        }) 
    };
})