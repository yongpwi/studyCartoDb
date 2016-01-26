/**
 * Created by yong on 2016. 1. 18..
 */

var dateChart = dc.compositeChart("#date-chart");
var volumeChart = dc.barChart('#monthly-volume-chart');
var gainOrLossChart = dc.pieChart('#gain-loss-chart');
var joinND = dc.numberDisplay("#joinNumber");
var outND = dc.numberDisplay("#outNumber");
var reasonChart = dc.rowChart("#reason-chart");
var reasonChart2 = dc.rowChart("#reason-chart2");

var allCharts = [
    {chart: dateChart, id: "#date-chart"},
    {chart: volumeChart, id: "#monthly-volume-chart"},
    {chart: gainOrLossChart, id: "#gain-loss-chart"},
    {chart: joinND, id: "#joinNumber"},
    {chart: outND, id: "#outNumber"},
    {chart: reasonChart, id: "#reason-chart"},
    {chart: reasonChart2, id: "#reason-chart2"}
];

var singleColor = ["#1a8bba"];
var outColor = ["#d73027"];
var singleColor2 = ["#1a8bba", "#d73027"];


var smallIcon = L.divIcon({className: "small-div-marker"});

var progress = document.getElementById('progress');
var progressBar = document.getElementById('progress-bar');

function updateProgressBar(processed, total, elapsed, layersArray) {
    if (elapsed > 1000) {
        // if it takes more than a second to load, display the progress bar:
        progress.style.display = 'block';
        progressBar.style.width = Math.round(processed/total*100) + '%';
    }

    if (processed === total) {
        // all markers processed - hide the progress bar:
        progress.style.display = 'none';
    }
}

//var mapClustersLayer = L.markerClusterGroup({maxClusterRadius: 60, chunkedLoading: true, chunkProgress: updateProgressBar});
var mapClustersLayer = L.markerClusterGroup({maxClusterRadius: 60, chunkedLoading: true, chunkProgress: updateProgressBar});

var tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    });

var latlng = L.latLng(37.67295135774715, 127.09396362304688);

var map = L.map('map', { center: latlng, zoom: 9, layers: [tiles] });

//var map = L.map('map', {
//    zoomControl: true,
//    center: [37.67295135774715, 127.09396362304688],
//    maxZoom: 18,
//    zoom: 9
//    //layers: [mapClustersLayer]
//});

var locations = null;
var onFiltered = function(chart, filter) {
    updateMap(locations.top(Infinity));
};

var updateMap = function(locs) {
    var markerList = [];
    mapClustersLayer.clearLayers();

    cartodb.createLayer(map, 'https://sphinfo.cartodb.com/api/v2/viz/531c05b4-c0c5-11e5-966d-42010a14800c/viz.json')
        .addTo(map, 0)
        .on('error', function() {
        cartodb.log.log("some error occurred");
    });
    //cartodb.createLayer(map, 'https://yjlee2.cartodb.com/api/v2/viz/7660723c-bf74-11e5-ac46-0e674067d321/viz.json')
    //    .addTo(map, 1)
    //    .on('done', function(layer) {
    //        layer.setInteraction(true);
    //        layer.on('featureOver', function(e, latlng, pos, data) {
    //            cartodb.log.log(e, latlng, pos, data);
    //        });
    //        layer.on('error', function(err) {
    //            cartodb.log.log('error: ' + err);
    //        });
    //    }).on('error', function() {
    //    cartodb.log.log("some error occurred");
    //});

    locs.map(function(item){
        if( item.g.latitude!=null && item.g.latitude!=undefined) {
            var marker =  L.marker([item.g.latitude, item.g.longitude],
                {icon: smallIcon}).bindPopup(
                item.t +
                "<br/>" + item.l +
                "<br/><strong>Enquiry ID:</strong>" + item.id +
                "<br/><strong>Opened: </strong>" + item.d +
                "<br/><strong>Status: </strong>" + item.a
            );
        }
        markerList.push(marker);
    });


    mapClustersLayer.addLayers(markerList);
    map.addLayer(mapClustersLayer);
};

var today = new Date();
var thirty_days_ago = d3.time.day(new Date(today.getTime() - 30*24*60*60*1000));
var tda_date = thirty_days_ago.toISOString().substring(0,10);


var boston_data_url = "https://data.cityofboston.gov/resource/awu8-dc52.csv?" +
    "$$app_token=bjp8KrRvAPtuf809u1UXnI0Z8&" + /* Socrata API app token */
    "$limit=50000&" +
        /* Renaming the columns to single-char-names helps reduce the payload,
         as does selecting only the columns we use. */
    "$select=case_enquiry_id as id, " +
    "open_dt as d, " +
    "closed_dt as c, " +
    "closure_reason as c_exp," +
    "source as s, " +
    "case_status as a, " +
    "neighborhood as n, " +
    "geocoded_location as g, " +
    "location as l, " +
    "case_title as t, " +
    "reason as r&" +
    "$where=open_dt>'" + tda_date + "'";

//var cartoDbJsonUrl = "SELECT * FROM table_29_20131106";
var cartoDbJsonUrl = "SELECT * FROM  public3_mod LIMIT 8000";
//var cartoDbJsonUrl = "SELECT * FROM public2 LIMIT 20000";
//var cartoDbJsonUrl = "SELECT * FROM  t_cable_customer_loc";
var cartoDbFile = "http://localhost:63342/studyCartoDb/sampleData/Restricted2.csv";

//d3.csv(cartoDbFile, function(err, data) {
d3.json('https://yhhan.cartodb.com/api/v2/sql/?q='+cartoDbJsonUrl, function(err, data) {
//d3.json('https://yjlee2.cartodb.com/api/v2/sql/?q='+cartoDbJsonUrl, function(err, data) {
    //var dateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");
    //var dateFormat = d3.time.format("%Y-%m-%d");
    //var dateFormat = d3.time.format("%m/%d/%Y %H:%M:%S %p");
    var dateFormat = d3.time.format("%m-%d-%Y");
    $.each(data.rows, function(index, d) {
    //data.forEach(function(d) {
        d.date_opened = dateFormat.parse(d.date);
        //d.date_outed = (d.outdate == "") ? "" : dateFormat.parse(d.outdate);
        //d.date_opened = dateFormat.parse(d.d);
        //d.date_closed = (d.outdate !== "") ? dateFormat.parse(d.outdate) : today;
        //d.date_closed = (d.c !== "") ? dateFormat.parse(d.c) : today;
        var lon = d.x;
        var lat = d.y;
        //d.cable_name = (d.cable_name !== "") ? d.cable_name : "Not reported";

        //var lat = d.g.split(',')[0].slice(1);
        //var lon = d.g.split(',')[1].slice(0,-1);
        //d.n = (d.n !== "") ? d.n : "Not reported";
        d.g = { latitude: lat, longitude: lon };
        //d.time_to_close = Math.round((d.date_closed - d.date_opened)/1000/60/60/24);
    });

    var index = crossfilter(data.rows);
    //var index = crossfilter(data);
    var all = index.groupAll();

    locations = index.dimension( function(d) { return d.g; });

    updateMap(locations.top(Infinity));

    var open_dates = index.dimension( function(d) { return d3.time.day(d.date_opened); } );


    var volumeByMonthGroup = open_dates.group().reduceSum(
        function(d) {
            if (d.is_reg_mod == 1) {
                return 1;
            } else {
                return 0;
            }
        }
    );
    var volumeByMonthGroup2 = open_dates.group().reduceSum(
        function(d) {
            if (d.is_reg_mod == 0) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    var status = index.dimension( function(d) {
        return d.is_reg;
    } );

    var joinCnt = status.group().reduceSum(
        function(d) {
            if (d.is_reg_mod == 1) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    var outCnt = status.group().reduceSum(
        function(d) {
            if (d.is_reg_mod == 0) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    var joinCableNmDimension = index.dimension(function(d){
        if(d.is_reg_mod == 1){
            return d.join_cable_name;
        }
    });

    var outCableNmDimension = index.dimension(function(d){
        if(d.is_reg_mod == 0){
            return d.join_cable_name;
        }
    });

    var joinCableNmGroup = joinCableNmDimension.group().reduceSum(function(d){
        if (d.is_reg_mod == 1) {
            return 1;
        } else {
            return 0;
        }
    });

    var outCableNmGroup = outCableNmDimension.group().reduceSum(function(d){
        if (d.is_reg_mod == 0) {
            return 1;
        } else {
            return 0;
        }
    });

    dateChart
        .width($('#date-chart').innerWidth()-30)
        .height(200)
        .margins({top: 10, left:40, right: 30, bottom:20})
        .x(d3.time.scale().domain([new Date(2014, 11, 1), new Date(2017, 12, 1)]))
        .dimension(open_dates)
        .elasticY(true)
        .renderHorizontalGridLines(true)

        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(880).y(0).itemHeight(13).gap(5))
        .brushOn(false)

        .compose([
            dc.lineChart(dateChart)
                .group(volumeByMonthGroup, "가입").renderArea(true),
            dc.lineChart(dateChart)
                .group(volumeByMonthGroup2, "탈퇴")
                .valueAccessor(function (d) {
                    return d.value;
                }).renderArea(true)
                .title(function (d) {
                    var value = d.data.value.outCount ? d.data.value.outCount : d.data.joinCount;
                    if (isNaN(value)) value = 0;
                    return value;
                })
                .ordinalColors(outColor)
                .useRightYAxis(false)
        ]);
        // Title can be called by any stack layer.
        //.title(function (d) {
        //    return d.value.outCount;
        //});
        //.yAxis().ticks(6);
    dateChart.on("postRedraw", onFiltered);

    volumeChart.width($('#date-chart').innerWidth()-30) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(70)
        .margins({top: 10, left:40, right: 30, bottom:20})
        .dimension(open_dates)
        .group(open_dates.group())
        .centerBar(true)
        .gap(10)
        .x(d3.time.scale().domain([new Date(2014, 11, 1), new Date(2017, 12, 1)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        //.yAxis().ticks(0)
        .xUnits(d3.time.months);

    volumeChart.yAxis().ticks(0);

    gainOrLossChart /* dc.pieChart('#gain-loss-chart', 'chartGroup') */
        // (_optional_) define chart width, `default = 200`
        .width(180)
        // (optional) define chart height, `default = 200`
        .height(180)
        // Define pie radius
        .radius(80)
        // Set dimension
        .dimension(status)
        // Set group
        .group(status.group())
        .ordinalColors(singleColor2)
        // (_optional_) by default pie chart will use `group.key` as its label but you can overwrite it with a closure.
        .label(function (d) {
            if (gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.key)) {
                return d.key + '(0%)';
            }
            var label = d.key;
            //if (all.value()) {
            if (all.reduceCount().value()) {
                label += '(' + Math.floor(d.value / all.reduceCount().value() * 100) + '%)';
            }
            return label;
        });

    joinND
        .group(joinCnt)
        .formatNumber(d3.format(",d"))
        .valueAccessor(function(d) { return d.value; });

    outND
        .group(outCnt)
        .formatNumber(d3.format(",d"))
        .valueAccessor(function(d) { return d.value; });


    reasonChart
        .width($('#reason-chart').innerWidth()-30)
        .height(500)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .ordinalColors(singleColor)
        .group(joinCableNmGroup)
        .dimension(joinCableNmDimension)
        .label( function(i) {
            return i.key; })
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    reasonChart2
        .width($('#reason-chart2').innerWidth()-30)
        .height(500)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .ordinalColors(outColor)
        .group(outCableNmGroup)
        .dimension(outCableNmDimension)
        .label( function(i) {
            return i.key; })
        .elasticX(true)
        .gap(1)
        //.renderTitleLabel(true)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    reasonChart.onClick = function() {};
    reasonChart2.onClick = function() {};

    dc.renderAll();
});

window.onresize = function(event) {
    allCharts.forEach(function(chart) {
        // Disable redraw animation first to prevent jitter while resizing window
        chart.chart.transitionDuration(0).width($(chart.id).innerWidth()-30);
    });
    dc.renderAll();
    // Set transition back to default:
    allCharts.forEach(function(chart) {
        chart.chart.transitionDuration(750);
    });
};
