//Width and height
            var wPie = 200;
            var hPie = 200;
            var dataset = [ 257, 7, 9 ];
            var outerRadius = wPie / 2;
            var innerRadius = outerRadius-35;
            var arc = d3.svg.arc()
                            .innerRadius(innerRadius)
                            .outerRadius(outerRadius);
            
            var pie = d3.layout.pie();
            
            //Easy colors accessible via a 10-step ordinal scale
            // var color = d3.scale.category10();
            var color = ["#808993","#00B7EB","#FF1493 "]
            //Create SVG element
            var svg = d3.select("#estadisticas")
                        .append("svg")
                        .attr("width", wPie)
                        .attr("height", hPie);
            
            //Set up groups
            var arcs = svg.selectAll("g.arc")
                          .data(pie(dataset))
                          .enter()
                          .append("g")
                          .attr("class", "arc")
                          .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");
            
            //Draw arc paths
            arcs.append("path")
                .attr("fill", function(d, i) {
                    return color[i];
                })
                .attr("d", arc);
            
            //Labels
            arcs.append("text")
                .attr("class","text")
                .attr("transform", function(d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.value;
                });