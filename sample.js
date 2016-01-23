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


//var hourChart = dc.barChart("#hour-chart");
//var dayChart = dc.rowChart("#day-chart");
//var sourceChart = dc.rowChart("#source-chart");
//var statusChart = dc.rowChart("#status-chart");
//var neighborhoodChart = dc.rowChart("#neighborhood-chart");
//var openDaysChart = dc.rowChart("#opendays-chart");
//var dataTable = dc.dataTable("#data-table");
//var dataCount = dc.dataCount('.data-count');

var allCharts = [
    {chart: dateChart, id: "#date-chart"},
    {chart: volumeChart, id: "#monthly-volume-chart"},
    {chart: gainOrLossChart, id: "#gain-loss-chart"},
    {chart: joinND, id: "#joinNumber"},
    {chart: outND, id: "#outNumber"},
    {chart: reasonChart, id: "#reason-chart"},
    {chart: reasonChart2, id: "#reason-chart2"}
    //{chart: hourChart, id: "#hour-chart"},
    //{chart: dayChart,  id: "#day-chart"},
    //{chart: sourceChart, id: "#source-chart"},
    //{chart: statusChart, id: "#status-chart"},
    //{chart: neighborhoodChart, id: "#neighborhood-chart"},
    //{chart: openDaysChart, id: "#opendays-chart"}
];

var singleColor = ["#1a8bba"];
var outColor = ["#d73027"];
var singleColor2 = ["#1a8bba", "#d73027"];


var smallIcon = L.divIcon({className: "small-div-marker"});

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
var mapClustersLayer = L.markerClusterGroup({maxClusterRadius: 60, chunkedLoading: true});

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
var cartoDbJsonUrl = "SELECT * FROM  t_cable_customer_loc LIMIT 20000";
//var cartoDbJsonUrl = "SELECT * FROM  t_cable_customer_loc";
var cartoDbFile = "http://localhost:63342/studyCartoDb/sampleData/Restricted2.csv";

//d3.csv(cartoDbFile, function(err, data) {
d3.json('https://yjlee2.cartodb.com/api/v2/sql/?q='+cartoDbJsonUrl, function(err, data) {
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

    //var sources = index.dimension( function(d) { return d.s; });
    //var open_dates = index.dimension( function(d) { return d3.time.day(d.date_opened); } );
    //var open_dates = index.dimension( function(d) { return d3.time.day(d.date_opened); } );
    var open_dates = index.dimension( function(d) { return d3.time.day(d.date_opened); } );


    var volumeByMonthGroup = open_dates.group().reduceSum(
        function(d) {
            if (d.is_reg == true) {
                return 1;
            } else {
                return 0;
            }
        }
    );
    var volumeByMonthGroup2 = open_dates.group().reduceSum(
        function(d) {
            if (d.is_reg == false) {
                return 1;
            } else {
                return 0;
            }
        }
    );
    //var volumeByMonthGroup2 = open_dates.group().reduce(
    //    function (p, v) {
    //        if(v.is_reg == false){
    //            ++p.outCount;
    //        }
    //        return p;
    //    },
    //    function (p, v) {
    //        if(v.is_reg == false){
    //            --p.outCount;
    //        }
    //        return p;
    //    },
    //    function () {
    //        return {outCount: 0};
    //    }
    //);

    //var open_hours = index.dimension( function(d) { return d.date_opened.getHours()+1; } );
    //var open_days = index.dimension( function(d) {
    //    var day = d.date_opened.getDay();
    //    var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    //    return day + '.' + name[day];
    //});

    var status = index.dimension( function(d) {
        return (d.is_reg == true)  ? '가입' : '탈퇴';
    } );
    //var status = index.dimension( function(d) {
    //    return d.is_reg;
    //} );

    var joinCnt = status.group().reduceSum(
        function(d) {
            if (d.is_reg == true) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    var outCnt = status.group().reduceSum(
        function(d) {
            if (d.is_reg == false) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    //var joinReasons = index.dimension( function(d) { return d.is_reg; } );
    //var neighborhoods = index.dimension( function(d) { return d.n; } );
    //var joinReasons = index.dimension( function(d) {
    //    return (d.is_reg == true)  ? '가입' : '탈퇴';
    //});
    var joinReasons = index.dimension(
        function(d) {
            if(d.is_reg == true){
                return d.cable_name;
            }
        }
    );

    var outReasons = index.dimension(
        function(d) {
            if(d.is_reg == false ){
                return d.cable_name;
            }
        }
    );

    var joinReasonsGroup = joinReasons.group().reduceSum(function(d){
        if (d.is_reg == true) {
            return 1;
        } else {
            return 0;
        }
    });

    var outReasonsGroup = outReasons.group().reduceSum(function(d){
        if (d.is_reg == false) {
            return 1;
        } else {
            return 0;
        }
    });

    locations = index.dimension( function(d) { return d.g; });
    //var days_open = index.dimension( function(d) { return d.time_to_close; });

    //dataCount
    //    .dimension(index)
    //    .group(all);

    dateChart
        .width($('#date-chart').innerWidth()-30)
        .height(200)
        .margins({top: 10, left:40, right: 30, bottom:20})
        //.rangeChart(volumeChart)
        //.x(d3.time.scale().domain([new Date(2014, 12, 1), today]))
        .x(d3.time.scale().domain([new Date(2014, 11, 1), new Date(2017, 12, 1)]))
        //.colors(singleColor2)
        .dimension(open_dates)
        //.group(volumeByMonthGroup2, 'Monthly Index Average')
        //.renderArea(true)
        //.valueAccessor(function (d) {
        //    return d.value.joinCount;
        //})
        //.renderArea(true)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        //##### Legend


        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(880).y(0).itemHeight(13).gap(5))
        .brushOn(false)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        //.stack(open_dates.group(), 'Monthly Index Move', function (d) {
        //    return d.value + 50;
        //})
        //// The `.valueAccessor` will be used for the base layer
        //.group(open_dates.group(), 'Monthly Index Average')
        //.valueAccessor(function (d) {
        //    return d.value.avg;
        //})
        //// Stack additional layers with `.stack`. The first paramenter is a new group.
        //// The second parameter is the series name. The third is a value accessor.
        //.stack(volumeByMonthGroup, 'Monthly Index Move', function (d) {
        //    return d.value.outCount;
        //})

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

    //Specify an area chart by using a line chart with `.renderArea(true)`.
    // <br>API: [Stack Mixin](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md#stack-mixin),
    // [Line Chart](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md#line-chart)
    //moveChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
    //    .renderArea(true)
    //    .width(990)
    //    .height(200)
    //    .transitionDuration(1000)
    //    .margins({top: 30, right: 50, bottom: 25, left: 40})
    //    .dimension(moveMonths)
    //    .mouseZoomable(true)
    //    // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
    //    .rangeChart(volumeChart)
    //    .x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
    //    .round(d3.time.month.round)
    //    .xUnits(d3.time.months)
    //    .elasticY(true)
    //    .renderHorizontalGridLines(true)
    //    //##### Legend
    //
    //    // Position the legend relative to the chart origin and specify items' height and separation.
    //    .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
    //    .brushOn(false)
    //    // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
    //    // legend.
    //    // The `.valueAccessor` will be used for the base layer
    //    .group(indexAvgByMonthGroup, 'Monthly Index Average')
    //    .valueAccessor(function (d) {
    //        return d.value.avg;
    //    })
    //    // Stack additional layers with `.stack`. The first paramenter is a new group.
    //    // The second parameter is the series name. The third is a value accessor.
    //    .stack(monthlyMoveGroup, 'Monthly Index Move', function (d) {
    //        return d.value;
    //    })
    //    // Title can be called by any stack layer.
    //    .title(function (d) {
    //        var value = d.value.avg ? d.value.avg : d.value;
    //        if (isNaN(value)) {
    //            value = 0;
    //        }
    //        return dateFormat(d.key) + '\n' + numberFormat(value);
    //    });

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

    //hourChart
    //    .width($('#hour-chart').innerWidth()-30)
    //    .height(250)
    //    .margins({top: 10, left:35, right: 10, bottom:20})
    //    .x(d3.scale.linear().domain([1,24]))
    //    .colors(singleColor)
    //    .dimension(open_hours)
    //    .group(open_hours.group())
    //    .gap(1)
    //    .elasticY(true);

    //dayChart
    //    .width($('#day-chart').innerWidth()-30)
    //    .height(183)
    //    .margins({top: 10, left:5, right: 10, bottom:-1})
    //    .label( function(i) { return i.key.split('.')[1]; })
    //    .title( function(i) { return i.key.split('.')[1] + ': ' + i.value; })
    //    .colors(singleColor)
    //    .dimension(open_days)
    //    .group(open_days.group())
    //    .elasticX(true)
    //    .gap(1)
    //    .xAxis().ticks(0);

    //statusChart
    //    .width($('#status-chart').innerWidth()-30)
    //    .height(60)
    //    .margins({top: 10, left:5, right: 10, bottom:-1})
    //    .colors(singleColor)
    //    .group(status.group())
    //    .gap(1)
    //    .dimension(status)
    //    .elasticX(true)
    //    .xAxis().ticks(0);

    //sourceChart
    //    .width($('#source-chart').innerWidth()-30)
    //    .height(158)
    //    .margins({top: 10, left:5, right: 10, bottom:-1})
    //    .colors(singleColor)
    //    .group(sources.group())
    //    .dimension(sources)
    //    .elasticX(true)
    //    .gap(1)
    //    .ordering(function(i){return -i.value;})
    //    .xAxis().ticks(0);

    //neighborhoodChart
    //    .width($('#neighborhood-chart').innerWidth()-30)
    //    .height(435)
    //    .margins({top: 10, left:5, right: 10, bottom:20})
    //    .colors(singleColor)
    //    .group(neighborhoods.group())
    //    .dimension(neighborhoods)
    //    .elasticX(true)
    //    .gap(1)
    //    .ordering(function(i){return -i.value;})
    //    .labelOffsetY(12)
    //    .xAxis().ticks(3);

    reasonChart
        .width($('#reason-chart').innerWidth()-30)
        .height(500)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .ordinalColors(singleColor)
        .group(joinReasonsGroup)
        .dimension(joinReasons)
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
        .group(outReasonsGroup)
        .dimension(outReasons)
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    //openDaysChart
    //    .width($('#opendays-chart').innerWidth()-30)
    //    .height(533)
    //    .margins({top: 10, left:5, right: 10, bottom:20})
    //    .colors(singleColor)
    //    .group(days_open.group())
    //    .dimension(days_open)
    //    .elasticX(true)
    //    .gap(1)
    //    .labelOffsetY(12)
    //    .xAxis().ticks(3);

    //dataTable
    //    .dimension(open_dates)
    //    .group(function (d) {
    //        return tda_date + " &ndash; present";
    //    })
    //    .size(100) // (optional) max number of records to be shown, :default = 25
    //    .columns([
    //        function(d) { return d.d; },
    //        function(d) { return d.id; },
    //        //function(d) { return d.a; },
    //        function(d) {
    //            var joinType = "가입";
    //            //if(d.outDate != ""){
    //            //    joinType = "해지"
    //            //}
    //            return joinType;
    //        },
    //        function(d) { return d.type; }
    //        ////function(d) { return d.l; },
    //        ////function(d) { return d.s; },
    //        //function(d) { return d.c_exp; }
    //    ])
    //    .sortBy( function(d) { return d.d })
    //    .order(d3.descending);

    dc.renderAll();
    updateMap(locations.top(Infinity));
console.log(all);
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
