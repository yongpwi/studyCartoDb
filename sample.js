/**
 * Created by yong on 2016. 1. 18..
 */

var dateChart = dc.lineChart("#date-chart");
var gainOrLossChart = dc.pieChart('#gain-loss-chart');

var hourChart = dc.barChart("#hour-chart");
var dayChart = dc.rowChart("#day-chart");
var sourceChart = dc.rowChart("#source-chart");
var statusChart = dc.rowChart("#status-chart");
var neighborhoodChart = dc.rowChart("#neighborhood-chart");
var reasonChart = dc.rowChart("#reason-chart");
var reasonChart2 = dc.rowChart("#reason-chart2");
var openDaysChart = dc.rowChart("#opendays-chart");
var dataTable = dc.dataTable("#data-table")
var dataCount = dc.dataCount('.data-count');

var allCharts = [
    {chart: dateChart, id: "#date-chart"},
    {chart: hourChart, id: "#hour-chart"},
    {chart: dayChart,  id: "#day-chart"},
    {chart: sourceChart, id: "#source-chart"},
    {chart: statusChart, id: "#status-chart"},
    {chart: neighborhoodChart, id: "#neighborhood-chart"},
    {chart: reasonChart, id: "#reason-chart"},
    {chart: reasonChart2, id: "#reason-chart2"},
    {chart: openDaysChart, id: "#opendays-chart"}
];

var singleColor = ["#1a8bba"];
var singleColor2 = ["#1a8bba", "orange"];


var smallIcon = L.divIcon({className: "small-div-marker"});
var mapClustersLayer = L.markerClusterGroup({maxClusterRadius: 50});
var map = L.map('map', {
    zoomControl: true,
    center: [36.5500, 126.9667],
    maxZoom: 18,
    zoom: 7,
    layers: [mapClustersLayer]
});

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    maxZoom:18
}).addTo(map);

var locations = null;
var onFiltered = function(chart, filter) {
    updateMap(locations.top(Infinity));
};

var updateMap = function(locs) {
    mapClustersLayer.clearLayers();
    var markers = locs.map(function(item){
        if( item.g.latitude!=null && item.g.latitude!=undefined) {
            return L.marker([item.g.latitude, item.g.longitude],
                {icon: smallIcon}).bindPopup(
                item.t +
                "<br/>" + item.l +
                "<br/><strong>Enquiry ID:</strong>" + item.id +
                "<br/><strong>Opened: </strong>" + item.d +
                "<br/><strong>Status: </strong>" + item.a
            );
        }
    });
    mapClustersLayer.addLayers(markers);
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

var cartoDbJsonUrl = "SELECT * FROM table_29_20131106";

//d3.csv(boston_data_url, function(err, data) {
d3.json('https://yhhan.cartodb.com/api/v2/sql/?q='+sql_statement, function(err, data) {
    //var dateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");
    var dateFormat = d3.time.format("%m/%d/%Y %H:%M:%S %p");
    data.forEach(function(d) {
        d.date_opened = dateFormat.parse(d.d);
        d.date_closed = (d.c !== "") ? dateFormat.parse(d.c) : today;
        var lat = d.g.split(',')[0].slice(1);
        var lon = d.g.split(',')[1].slice(0,-1);
        d.n = (d.n !== "") ? d.n : "Not reported";
        d.g = { latitude: lat, longitude: lon };
        d.time_to_close = Math.round((d.date_closed - d.date_opened)/1000/60/60/24);
    });

    var index = crossfilter(data);
    var all = index.groupAll();

    var sources = index.dimension( function(d) { return d.s; });
    var open_dates = index.dimension( function(d) { return d3.time.hour(d.date_opened); } );
    var open_hours = index.dimension( function(d) { return d.date_opened.getHours()+1; } );
    var open_days = index.dimension( function(d) {
        var day = d.date_opened.getDay();
        var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return day + '.' + name[day];
    });
    var status = index.dimension( function(d) { return d.a; } );
    var neighborhoods = index.dimension( function(d) { return d.n; } );
    var reasons = index.dimension( function(d) { return d.r; } );
    locations = index.dimension( function(d) { return d.g; });
    var days_open = index.dimension( function(d) { return d.time_to_close; });

    // Group by total movement within month
    var monthlyMoveGroup = open_dates.group().reduceSum(function (d) {
        return Math.abs(d.close - d.open);
    });

    var indexAvgByMonthGroup = open_dates.group().reduce(
        function (p, v) {
            ++p.days;
            p.total += (v.open + v.close) / 2;
            p.avg = Math.round(p.total / p.days);
            return p;
        },
        function (p, v) {
            --p.days;
            p.total -= (v.open + v.close) / 2;
            p.avg = p.days ? Math.round(p.total / p.days) : 0;
            return p;
        },
        function () {
            return {days: 0, total: 0, avg: 0};
        }
    );

    dataCount
        .dimension(index)
        .group(all);

    dateChart
        .width($('#date-chart').innerWidth()-30)
        .height(200)
        .margins({top: 10, left:30, right: 10, bottom:20})
        .x(d3.time.scale().domain([thirty_days_ago, today]))
        .colors(singleColor2)
        .dimension(open_dates)
        .group(open_dates.group(), 'Monthly Index Average')
        .renderArea(true)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        //##### Legend

        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(770).y(0).itemHeight(13).gap(5))
        //.brushOn(false)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        .stack(open_dates.group(), 'Monthly Index Move', function (d) {
            return d.value + 50;
        })
        //// The `.valueAccessor` will be used for the base layer
        //.group(open_dates.group(), 'Monthly Index Average')
        //.valueAccessor(function (d) {
        //    return d.value.avg;
        //})
        //// Stack additional layers with `.stack`. The first paramenter is a new group.
        //// The second parameter is the series name. The third is a value accessor.
        //.stack(open_dates.group(), 'Monthly Index Move', function (d) {
        //    return d.value;
        //})
        //// Title can be called by any stack layer.
        //.title(function (d) {
        //    var value = d.value.avg ? d.value.avg : d.value;
        //    if (isNaN(value)) {
        //        value = 0;
        //    }
        //    return dateFormat(d.key) + '\n' + numberFormat(value)
        //})
        .yAxis().ticks(6);
    dateChart.on("postRedraw", onFiltered);

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
        // (_optional_) by default pie chart will use `group.key` as its label but you can overwrite it with a closure.
        .label(function (d) {
            if (gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.data.key)) {
                return d.data.key + '(0%)';
            }
            var label = d.data.key;
            if (all.value()) {
                label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
            }
            return label;
        });

    hourChart
        .width($('#hour-chart').innerWidth()-30)
        .height(250)
        .margins({top: 10, left:35, right: 10, bottom:20})
        .x(d3.scale.linear().domain([1,24]))
        .colors(singleColor)
        .dimension(open_hours)
        .group(open_hours.group())
        .gap(1)
        .elasticY(true);

    dayChart
        .width($('#day-chart').innerWidth()-30)
        .height(183)
        .margins({top: 10, left:5, right: 10, bottom:-1})
        .label( function(i) { return i.key.split('.')[1]; })
        .title( function(i) { return i.key.split('.')[1] + ': ' + i.value; })
        .colors(singleColor)
        .dimension(open_days)
        .group(open_days.group())
        .elasticX(true)
        .gap(1)
        .xAxis().ticks(0);

    statusChart
        .width($('#status-chart').innerWidth()-30)
        .height(60)
        .margins({top: 10, left:5, right: 10, bottom:-1})
        .colors(singleColor)
        .group(status.group())
        .gap(1)
        .dimension(status)
        .elasticX(true)
        .xAxis().ticks(0);

    sourceChart
        .width($('#source-chart').innerWidth()-30)
        .height(158)
        .margins({top: 10, left:5, right: 10, bottom:-1})
        .colors(singleColor)
        .group(sources.group())
        .dimension(sources)
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .xAxis().ticks(0);

    neighborhoodChart
        .width($('#neighborhood-chart').innerWidth()-30)
        .height(435)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .colors(singleColor)
        .group(neighborhoods.group())
        .dimension(neighborhoods)
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    reasonChart
        .width($('#reason-chart').innerWidth()-30)
        .height(1000)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .colors(singleColor)
        .group(reasons.group())
        .dimension(reasons)
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    reasonChart2
        .width($('#reason-chart2').innerWidth()-30)
        .height(1000)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .colors(singleColor)
        .group(reasons.group())
        .dimension(reasons)
        .elasticX(true)
        .gap(1)
        .ordering(function(i){return -i.value;})
        .labelOffsetY(12)
        .xAxis().ticks(3);

    openDaysChart
        .width($('#opendays-chart').innerWidth()-30)
        .height(533)
        .margins({top: 10, left:5, right: 10, bottom:20})
        .colors(singleColor)
        .group(days_open.group())
        .dimension(days_open)
        .elasticX(true)
        .gap(1)
        .labelOffsetY(12)
        .xAxis().ticks(3);

    dataTable
        .dimension(open_dates)
        .group(function (d) {
            return tda_date + " &ndash; present";
        })
        .size(100) // (optional) max number of records to be shown, :default = 25
        .columns([
            function(d) { return d.d; },
            function(d) { return d.id; },
            function(d) { return d.a; },
            function(d) { return d.t; },
            function(d) { return d.l; },
            function(d) { return d.s; },
            function(d) { return d.c_exp; }
        ])
        .sortBy( function(d) { return d.d })
        .order(d3.descending);

    dc.renderAll();
    updateMap(locations.top(Infinity));

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
