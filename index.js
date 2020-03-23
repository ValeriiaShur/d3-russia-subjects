// need to use jquery to get json from a different url
$.getJSON({
    url: "https://raw.githubusercontent.com/ValeriiaShur/d3-russia-subjects/master/russia-subjects.json",
    success: makeMap
});

// map making code goes in here
function makeMap(us) {
    var margin = { top: 25, right: 20, bottom: 40, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom,
        centered,
        animation;

    var projection = d3.geoConicEquidistant()
        .rotate([-105, 0])
        .center([-10, 65])
        .parallels([50, 66])
        .scale(400)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#map").append("svg")
        /*         .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom) */
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .classed("svg-content", true)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var state_features = topojson.feature(us, us.objects.subjects).features;

    var feature_domain = [0, state_features.length - 1];

    // setup x
    var xScale = d3.scaleLinear().range([0, width]).domain(feature_domain), // value -> display
        xAxis = d3.axisBottom().scale(xScale);

    // setup y
    var yScale = d3.scaleLinear().range([height, 0]).domain(feature_domain), // value -> display
        yAxis = d3.axisLeft().scale(yScale);

    // x-axis
    var x_axis_g = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis).style('opacity', 0);

    x_axis_g.append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Random X variable");

    // y-axis
    var y_axis_g = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .style('opacity', 0);

    y_axis_g.append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Random Y variable");


    var g = svg.append("g");


    var scale = d3.scaleLinear()
        .domain(feature_domain)
        .range([0, Math.PI * 2]);

    var states = g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(state_features)
        .enter().append("path")
        .attr("d", path);

    var default_size = function (d, i) { return 40; };
    var exploder = d3.exploder()
        .projection(projection)
        .size(default_size);



    function addButton(text, callback) {
        d3.select("#buttons").append('button')
            .text(text)
            .on('click', function () {
                // clear running animation
                animation = clearTimeout(animation);
                // hide axis
                x_axis_g.transition().duration(500).style('opacity', 0);
                y_axis_g.transition().duration(500).style('opacity', 0);
                // reset to default size
                exploder.size(default_size);
                callback.call(this);
            })
    }

    // --------------------------
    //
    // randomly ordered grid
    //
    // --------------------------
    addButton('random grid', function () {
        var rand = d3.shuffle(d3.range(state_features.length));
        states.transition()
            .duration(500)
            .call(
                exploder.position(function (d, index) {
                    var i = rand[index];
                    var px = Math.max(0, width - 9 * 75) / 2
                    return [px + (i % 13) * 60, 50 + Math.floor(i / 13) * 40];
                })
            );
    });


    // --------------------------
    //
    // Circle Plot
    //
    // --------------------------
    function circle(d, i) {
        var t = scale(i);
        var r = (height / 2) * .7;
        var x = width / 2 + r * Math.cos(t);
        var y = height / 2 + r * Math.sin(t);
        return [x, y];
    }
    addButton('circle', function (d, i) {
        states.transition()
            .duration(500)
            .call(exploder.position(circle));
    });


    // --------------------------
    //
    // Figure 8 plot
    //
    // --------------------------
    function figure8(d, i) {
        var t = scale(i);
        var r = (height / 2) * .9;
        var d = (0.7 + Math.pow(Math.sin(t), 2));
        var x = width / 2 + (r * Math.cos(t)) / d;
        var y = height / 2 + (r * Math.sin(t) * Math.cos(t)) / d;
        return [x, y];
    }
    addButton('figure 8 animated', function () {
        var advance = 1;
        function tick() {
            states
                .transition()
                .duration(500)
                .call(exploder.position(function (d, i) {
                    return figure8(d, i + advance++);
                }));
        }
        animation = setInterval(tick, 550)
        tick();
    });



    // --------------------------
    //
    // spiral Plot
    //
    // --------------------------
    var spiral_scale = d3.scaleLinear()
        .domain(feature_domain)
        .range([0, 60000]);
    var size_scale = d3.scaleLinear()
        .domain(feature_domain)
        .range([10, 70]);

    function spiral(d, i) {
        var t = spiral_scale(i);
        var x = width / 2 + Math.pow(t, 1 / 2.2) * Math.cos(t);
        var y = height / 2 + Math.pow(t, 1 / 2.2) * Math.sin(t);
        return [x, y];
    }
    addButton('spiral', function (d, i) {
        states.transition()
            .duration(500)
            .call(
                exploder
                    .position(spiral)
                    .size(function (d, i) {
                        return size_scale(i);
                    })
            );
    });



    // --------------------------
    //
    // Scatter Plot
    //
    // --------------------------
    addButton('scatter', function (d, i) {


        // hide axis
        x_axis_g.transition().duration(500).style('opacity', 1);
        y_axis_g.transition().duration(500).style('opacity', 1);

        states.transition()
            .duration(500)
            .call(
                exploder.position(function (d, i) {
                    var x = xScale(i) + (0.5 + Math.random()) * 0.9;
                    var y = yScale(i) + (0.5 + Math.random()) * 0.9;
                    return [x, y];
                })
            );

    });



    // --------------------------
    //
    // realign map
    //
    // --------------------------
    addButton('reset', function () {
        states.transition()
            .duration(500)
            .attr("d", path)
            .attr("transform", "translate(0,0)");
    });
    ;
}