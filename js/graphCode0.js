d3.json("data/oaxaca_Jun262016_filtro_preprocesado.json", function(data) {

    links = []

    data.forEach(function(a) {

        /*Replies*/
        if (a.in_reply_to_status_id_str != 'None' && a.in_reply_to_screen_name != a.from_user) {
            var cont_replies = 1;
            var actual = {
                "source": a.from_user,
                "target": a.in_reply_to_screen_name,
                "interaction": "reply",
                "replies": cont_replies
            }
            links.push(actual);
        }

        /*Mentions*/
        if (a.text.indexOf('RT @') == -1)

        // if ( a.in_reply_to_screen_name == 'None' && a.text.indexOf('RT @') == -1 && a.user_mentions != a.from_user ) 
        {
            a.user_mentions.forEach(function(m) {
                if (m != a.from_user && m != a.in_reply_to_screen_name) {
                    var cont_mentions = 1;
                }
                var actual = {
                    "source": a.from_user,
                    "target": m,
                    "interaction": "mention",
                    "mentions": cont_mentions
                }
                if (m != a.from_user && m != a.in_reply_to_screen_name) {
                    links.push(actual);
                }
            });
        }

        /*Retweets*/
        if (a.text.indexOf('RT @') > -1) {
            tuit_div = a.text.split(" ");
            rt_user = tuit_div[1].replace('@', '').replace(':', '');
            var cont_retuits = 1;
            var actual = {
                "source": a.from_user,
                "target": rt_user,
                "interaction": "retweet",
                "retuits": cont_retuits
            }
            links.push(actual);
        }

    });

    // Determina el conjunto de nodos a partir de los enlaces
    var nodeset = {};
    links.forEach(function(link) {
        link.source = nodeset[link.source] || (nodeset[link.source] = {
            name: link.source
        });
        link.target = nodeset[link.target] || (nodeset[link.target] = {
            name: link.target
        });
    });

    // Ordena los enlaces por origen, por destino y por tipo de interacción
    links.sort(function(a, b) {
        if (a.source.name > b.source.name) {
            return 1;
        } else if (a.source.name < b.source.name) {
            return -1;
        } else if (a.target.name > b.target.name) {
            return 1;
        } else if (a.target.name < b.target.name) {
            return -1;
        } else {
            if (a.interaction > b.interaction) {
                return 1;
            }
            if (a.interaction < b.interaction) {
                return -1;
            } else {
                return 0;
            }
        }
    });

    // Establece el número de enlaces entre dos nodos, inicia en 1
    links.forEach(function(d) {
        d.linknum = 1;
    });
    // Aumenta el número de enlaces si hay más de un tipo de interacción
    for (var i = 0; i < links.length; i++) {
        if (i != 0 &&
            links[i].source.name == links[i - 1].source.name &&
            links[i].target.name == links[i - 1].target.name)
            if (links[i].interaction != links[i - 1].interaction) {
                links[i].linknum = links[i - 1].linknum + 1;
            } else if (links[i].interaction == links[i - 1].interaction) {
            links[i].linknum = links[i - 1].linknum;
        }
    };

    // Determina si el enlace será recto o curvo
    links.forEach(function(d) {
        d.straight = 1;
        if (d.linknum == 2 || d.linknum == 3) {
            d.straight = 0
        }
        links.forEach(function(d1) {
            if (d.source == d1.target && d1.source == d.target)
                d.straight = 0;
            else if (d.linknum == 1 && d.source == d1.source && d.target == d1.target && d1.linknum >= 2)
                d.straight = 0;
        });
    });

    //Calcula la frecuencia de un tipo de interacción
    for (var i = 0; i < links.length; i++) {
        if (i != 0 &&
            links[i].source.name == links[i - 1].source.name &&
            links[i].target.name == links[i - 1].target.name)
            if (links[i].interaction == "mention" && links[i].interaction == links[i - 1].interaction) {
                links[i].mentions = links[i - 1].mentions + 1;
            } else if (links[i].interaction == "reply" && links[i].interaction == links[i - 1].interaction) {
            links[i].replies = links[i - 1].replies + 1;
        } else if (links[i].interaction == "retweet" && links[i].interaction == links[i - 1].interaction) {
            links[i].retuits = links[i - 1].retuits + 1;
        }
    };

    nodes = d3.values(nodeset);

    //Suma uno cada vez que el nodo es origen: el tamaño refleja Grado de recepción
    nodes.forEach(function(d) {
        d.inDegree = 0;
        links.forEach(function(d1) {
            if (d == d1.target)
                d.inDegree++;
        });
    });

    //Suma uno cada vez que el nodo es destino: el tamaño refleja Grado de emisión
    // nodes.forEach(function(d) {
    //     d.inDegree = 0;
    //     links.forEach(function(d1) {
    //         if (d == d1.source)
    //             d.inDegree++;
    //     });
    // });  

    // Establece el radio de cada nodo con base en la medida selccionada
    nodes.forEach(function(d) {
        baseRadius = (Math.sqrt(1 / Math.PI)) * 5;
        baseNodeArea = Math.PI * (baseRadius * baseRadius);
        if (d.inDegree > 0) {
            d.radius = Math.sqrt((baseNodeArea * (d.inDegree * 1.7)) / Math.PI);
        } else {
            d.radius = baseRadius
        }
    });

    //Ordena los nodos de acuerdo con la medida seleccionada
    nodes.sort(function(a, b) {
        if (a.inDegree < b.inDegree) {
            return 1;
        } else if (a.inDegree > b.inDegree) {
            return -1;
        } else {
            return 0;
        }
    });

    //Crea una lista de los nodos con los 10 valores más altos
    var nodeList = [];
    for (var i = 0; i < 10; i++) {
        var este = nodes[i].name;
        nodeList.push(este);
    };

    //Almacena quién está conectado con quién
    var linkedByIndex = {};
    links.forEach(function(d) {
        linkedByIndex[d.source.name + "," + d.target.name] = 1;
    });
    //Verifica si un par de nodos son vecinos
    function neighboring(a, b) {
        return linkedByIndex[a.name + "," + b.name] || a.name == b.name;
    }
    // Destaca vecinos de nodo seleccionado
    var toggle = 0;
    function connectedNodes(d) {
        if (toggle == 0) {
            node.style("opacity", function(o) {
                return neighboring(d, o) | neighboring(o, d) ? 1 : 0;
            });
            link.style("opacity", function(o) {
                return d.index == o.source.index | d.index == o.target.index ? 1 : 0;
            });
            // text.style("opacity",0.025);
            toggle = 1;
        } else {
            node.style("opacity", 1);
            link.style("opacity", 1);
            // text.style("opacity", 1);
            toggle = 0;
        }
    }

    //Asigna a cada nodo un atributo por tipo de interacción. Valor inicial es false
    nodes.forEach(function(d) {
        d.retweeting = false;
        d.replying = false;
        d.mentioning = false;
    });
    //Busca el tipo de interacción de cada enlace, y cambia el atributo de los nodos asignado en el paso anterior
    links.forEach(function(d) {
        if (d.interaction == "reply") {
            nodes.forEach(function(e) {
                if (e.name == d.target.name || e.name == d.source.name) {
                    e.replying = true
                }
            });
        } else if (d.interaction == "mention") {
            nodes.forEach(function(e) {
                if (e.name == d.target.name || e.name == d.source.name) {
                    e.mentioning = true
                }
            });
        } else if (d.interaction == "retweet") {
            nodes.forEach(function(e) {
                if (e.name == d.target.name || e.name == d.source.name) {
                    e.retweeting = true
                }
            });
        }
    });

    //240-267: Localiza el nodo más mencionado. Util para seleccionar el componente más grande
    mentioned=[];
    links.forEach(function(d){
            if(d.interaction==="mention"){
            mentioned.push(d.target.name);
        }
    });
    mentioned.sort(function(a,b){
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        } else {
            return 0;
        }
    });
    var max=0, mostMentioned='', freq=1;
    for(var i=0; i<mentioned.length; i++){
        if(mentioned[i]===mentioned[i+1]){freq++;}
        else{freq=1;}
        if(freq>max){
            mostMentioned=mentioned[i];
            max=freq;
        }
    };

    //Lee el json de clasificación de cuentas y asigna una clase a cada nodo
    d3.json("data/ListasActores/hoy_no_circula_Apr022016_clas.json", function(data) {

        nodes.forEach(function(d) {
            d.class = "";
            var str = d.name;
            for (var i = 0; i < data.length; i++) {
                if (str.toLowerCase() == data[i].name) {
                    d.type = data[i].score;
                }
            }

            if (d.type == 2) {
                d.class = "medio";
            } else if (d.type == 1) {
                d.class = "politico";
            } else {
                d.class = "ciudadano";
            }
        });

        node.attr("class", function(d) {
            return d.class;
        });

        //Quita o devuelve los colores por categoría de todos los nodos
        var cambioColor = 0;
        d3.select("#nc").on("click", function(d) {
            if (cambioColor==0) {
                node.attr("class", "node");
                cambioColor = 1;
            } else if (cambioColor==1) {
                node.attr("class", function(d) {
                    return d.class;
                });
                cambioColor = 0;
            }
        });

        //Checa cuántos checkboxes están activos y ejecuta una función para mostrar/esconder interacciones
        var howManyLinks = 3;
        d3.selectAll("#selectorsNodes input[type=checkbox]").on("click", function() {
            if (this.checked == true) {
                howManyLinks++;
            } else if (this.checked == false && howManyLinks > 0) {
                howManyLinks--;
            } else if (howManyLinks < 0) {
                howManyLinks = 0;
            }
            hidingNodes();
        });

        var noCiudadanos = [];
        nodes.forEach(function(n){
            if(n.class!=="ciudadano"){
                noCiudadanos.push(n);
            }
        });

        var vecinoCiudadanos = [];
        links.forEach(function(l){
            if(l.source.class==="ciudadano"){
                noCiudadanos.forEach(function(d){
                    if(l.target===d && vecinoCiudadanos.indexOf(d)===-1 ){
                        vecinoCiudadanos.push(d);
                    }
                });
            }else if(l.target.class==="ciudadano"){
                noCiudadanos.forEach(function(d){
                    if(l.source===d && vecinoCiudadanos.indexOf(d)===-1 ){
                        vecinoCiudadanos.push(d);
                    }
                });
            }
        });

        noCiudadanos.forEach(function(d){
            console.log(d.name);
        });

        // console.log(vecinoCiudadanos);
        // console.log(nodes.length);
        // console.log(noCiudadanos);


        function hidingNodes(){
        d3.selectAll("#selectorsNodes input")
            .each(function(d){
                if (howManyLinks === 0) {
                    node.style("opacity", 0);
                    link.style("opacity", 0);
                }
                else if (howManyLinks===2 && d3.select("#Politicos").property("checked") === true && d3.select("#Medios").property("checked") === true) {
                    link.filter(function(l){
                        if(l.source.class==="ciudadano" || l.target.class==="ciudadano"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        for(var i=0;i<vecinoCiudadanos.length;i++){
                            vecino=vecinoCiudadanos[i];
                            if(n===vecino){
                                return n;
                            }else if(n.class==="ciudadano"){
                                return n;
                            }
                        }
                    })
                        .style("opacity",0);
                }
            });
        }

    });

    /*======================================================================
    ANITALAVALATINANITALAVALATINANITALAVALATINANITALAVALATINANITALAVALATINA
    ======================================================================*/

    /*Tamaño del SVG*/
    var width = $(window).width();
    height = $(window).height();

    /*Tipo de visualización*/
    var force = d3.layout.force()
        //.charge(-100)//-100
        .charge(function(d) {
            return (d.inDegree + 1) * (-180);
        })
        .linkDistance(40)
        // PARA MODIFICAR EL TAMAÑO DE LOS ENLACES SEGÚN EL GRADO DE RECEPCIÓN DEL NODO
        // .linkDistance(function(d){
        //   var in_min=1,in_max=10,out_min=50,out_max=30;
        //   return ((((d.target.inDegree) - in_min) * (out_max - out_min)) / (in_max - in_min)) + out_min;
        // })
        .gravity(.3)
        //.friction(.8)
        .size([width, height]);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<span style='color:white'>" + d.name + " , " + d.inDegree + "</span>";
        });

    /*Se inicializa el svg*/
    var vis = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all")
        .call(d3.behavior.zoom().on("zoom", redraw))
        .append("g")
        // .attr("viewBox", "1000 1000 " + width + " " + height)
        // .attr("transform","scale(.25)")
        .call(tip);

    //Zoom
    function redraw() {
        vis.attr("transform",
            "translate(" + d3.event.translate + ")" +
            " scale(" + d3.event.scale + ")");
    }

    force
        .nodes(nodes)
        .links(links)
        .start();

    var link = vis.selectAll(".link")
        .data(links)
        .enter().append("path")
        //filtrar y dibujar solo los enlaces más gruesos
        // .filter(function(d){
        //   links.forEach(d1){
        //     if (d.source.name == d1.source.name && d.target.name == d1.target.name){ return max d.}
        //   }
        // })
        .attr("class", function(d) {
            return d.interaction;
        })
        .attr("fill", "none")
        .style("stroke-width", function(d) {
            if (d.interaction == "reply") {
                return d.replies;
            } else if (d.interaction == "retweet") {
                return d.retuits;
            } else {
                return d.mentions;
            }
        })
        .style("marker-end", "url(#flecha)");

    var marker = vis.selectAll("marker")
        .data(links)
        .enter().append("marker")
        .attr("id", "flecha")
        .attr("viewBox", "0 -8 16 16")
        .attr("refX", 15)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 15)
        .attr("markerHeight", 20)
        .attr("orient", "auto")
        .append("path")
        .attr("stroke", "#14141c")                
        .attr("fill", "#F2F3F4")
        .attr("stroke-width", 1)
        .attr("d", "M0,-5 L 14,0 L0,5 L4,0 Z");

    var drag = force.drag()
        .on("dragstart", function(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.event.sourceEvent.preventDefault();
        });

    var node = vis.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("id",function(d){
            return "c"+d.name;
        })
        .attr("r", function(d) {
            return d.radius;
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on('click', function(d) {
            if (d3.event.defaultPrevented === false) {
                connectedNodes(d);
                d3.selectAll("#selectors input[type=checkbox]").property("checked", true);
                howMany = 3;
            }
        })
        // .call(force.drag)
    ;

    var text = vis.selectAll(".text")
        .data(nodes)
        .enter().append("text")
        .attr("dx",16)
        .attr("dy",6)
        .attr("class","text")
        .attr("font-size",function(d){
            return Math.sqrt((d.inDegree+10)*25) + "px";
        })
        // Dibuja los nombres del top 10 de nodos
        .text(function(d) {
          for (var i=0; i<nodeList.length; i++){
            name=nodeList[i];
            if (d.name == name)
            return d.name; }
        })
        //Dibuja nombres específicos
        // .text(function(d) {
        //     if (d.name == "LeeMonserrat") {
        //         return d.name;
        //     }
        // })
        .style("opacity", 0);

    force.on("tick", function() {
        link.attr("d", function(d) {

            //Enlaces bidireccionales curvos, unidireccionales rectos
            diffX = d.target.x - d.source.x;
            diffY = d.target.y - d.source.y;

            // Length of path from center of source node to center of target node
            pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));

            // x and y distances from center to outside edge of target node
            if (pathLength == 0) {
                pathLength = 0.01;
            }

            offsetX = (diffX * d.target.radius) / pathLength;
            offsetY = (diffY * d.target.radius) / pathLength;

            dr = (d.straight == 1) ? 0 : Math.sqrt(diffX * diffX + diffY * diffY) * d.linknum;


            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1" + (d.target.x - offsetX) + "," + (d.target.y - offsetY);
        })

        node.attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });

        text.attr("x", function(d) {
                return d.x;
            })
            .attr("y", function(d) {
                return d.y;
            });
    });

    //Subconjuntos de nodos por tipo de interacción
    var RtRpM = [],RtRp = [],RtM = [],RpM = [],Rp = [],Rt = [],M = [];
    nodes.forEach(function(d) {
        //Retuits+Replies+Menciones
        if (d.retweeting == true && d.replying == true && d.mentioning == true) {
            RtRpM.push(d);
        }
        //Retuits+Replies-Menciones
        if ((d.retweeting == true && d.replying == true && d.mentioning == false) || (d.replying == true && d.mentioning == false && d.retweeting == false) || (d.retweeting == true && d.replying == false && d.mentioning == false)) {
            RtRp.push(d);
        }
        //Retuits+Menciones-Replies
        if ((d.retweeting == true && d.replying == false && d.mentioning == false) || (d.retweeting == true && d.mentioning == true && d.replying == false) || (d.mentioning == true && d.retweeting == false && d.replying == false)) {
            RtM.push(d);
        }
        //Replies+Menciones-Retuits
        if ((d.replying == true && d.mentioning == true && d.retweeting == false) || (d.replying == true && d.mentioning == false && d.retweeting == false) || (d.mentioning == true && d.retweeting == false && d.replying == false)) {
            RpM.push(d);
        }
        if (d.replying == true && d.mentioning == false && d.retweeting == false) {
            Rp.push(d);
        }
        if (d.retweeting == true && d.replying == false && d.mentioning == false) {
            Rt.push(d);
        }
        if (d.mentioning == true && d.retweeting == false && d.replying == false) {
            M.push(d);
        }
    });

    //Subconjuntos de enlaces
    var eRpRt = [],eRpM = [],eRtM = [];
    links.forEach(function(d) {
        if (d.interaction === "retweet" || d.interaction === "reply") {
            eRpRt.push(d);
        }
        if (d.interaction === "reply" || d.interaction === "mention") {
            eRpM.push(d);
        }
        if (d.interaction === "retweet" || d.interaction === "mention") {
            eRtM.push(d);
        }
    })

    //Muestra/oculta todos los enlaces
    var cambio = 0;
    d3.select("#ha").on("click", function(d) {
        if (cambio === 0 && howMany===3) {
            link.transition(600)
                .style("opacity", 0);
            cambio = 1;
            d3.selectAll("#selectors input[type=checkbox]").property("checked", false);
            howMany = 0;
        } else if((cambio === 1 && (howMany===0 | howMany===3))) {
            link.transition(600)
                .style("opacity", 1);
            node.transition(600)
                .style("opacity", 1);
            cambio = 0;
            d3.selectAll("#selectors input[type=checkbox]").property("checked", true);
            howMany = 3;
        }
    });

    //Checa cuántos checkboxes están activos y ejecuta una función para mostrar/esconder interacciones
    var howMany = 3;
    d3.selectAll("#selectors input[type=checkbox]").on("click", function() {
        if (this.checked == true) {
            howMany++;
        } else if (this.checked == false && howMany > 0) {
            howMany--;
        } else if (howMany < 0) {
            howMany = 0;
        }
        hideElements();
    });

    //Checa qué checkboxes están seleccionados y oculta enlaces, con sus respectivos nodos, según tipo de interacción
    function hideElements() {
        d3.selectAll("#selectors input[type=checkbox]")
            .each(function(d) {
                // if(howMany===3){
                //   node.style("opacity",1);
                //   link.style("opacity",1);
                // }
                if (howMany === 0) {
                    node.style("opacity", 0);
                    link.style("opacity", 0);
                } else if (howMany === 2 && d3.select("#Replies").property("checked") === true && d3.select("#Retweets").property("checked") === true) {
                    link.filter(function(d) {
                            return d.interaction == "mention"
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < M.length; i++) {
                                var nodo = M[i];
                                if (d.name === M[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                } else if (howMany === 2 && d3.select("#Replies").property("checked") === true && d3.select("#Mentions").property("checked") === true) {
                    link.filter(function(d) {
                            return d.interaction == "retweet"
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < Rt.length; i++) {
                                var nodo = Rt[i];
                                if (d.name === Rt[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                } else if (howMany === 2 && d3.select("#Retweets").property("checked") === true && d3.select("#Mentions").property("checked") === true) {
                    link.filter(function(d) {
                            return d.interaction == "reply"
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < Rp.length; i++) {
                                var nodo = Rp[i];
                                if (d.name === Rp[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                } else if (howMany === 1 && d3.select("#Retweets").property("checked") === true) {
                    link.filter(function(d) {
                            for (var i = 0; i < eRpM.length; i++) {
                                if (d === eRpM[i]) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < RpM.length; i++) {
                                if (d.name === RpM[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                } else if (howMany === 1 && d3.select("#Replies").property("checked") === true) {
                    link.filter(function(d) {
                            for (var i = 0; i < eRtM.length; i++) {
                                if (d === eRtM[i]) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < RtM.length; i++) {
                                var nodo = RtM[i];
                                if (d.name === RtM[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                } else if (howMany === 1 && d3.select("#Mentions").property("checked") === true) {
                    link.filter(function(d) {
                            for (var i = 0; i < eRpRt.length; i++) {
                                if (d === eRpRt[i]) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                    node.filter(function(d) {
                            for (var i = 0; i < RtRp.length; i++) {
                                var nodo = RtRp[i];
                                if (d.name === RtRp[i].name) {
                                    return d;
                                }
                            }
                        })
                        .style("opacity", 0);
                }
            });
    }

    //Checa qué checkboxes se desactivan y muestra enlaces, con sus respectivos nodos, según tipo de interacción
    d3.selectAll("#selectors input[type=checkbox]").on("mouseup", function(d) {
        if (d3.select("#Mentions").property("checked" === true)) {
            link.filter(function(d) {
                    for (var i = 0; i < eRpRt.length; i++) {
                        if (d === eRpRt[i]) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
            node.filter(function(d) {
                    for (var i = 0; i < RtRp.length; i++) {
                        var nodo = RtRp[i];
                        if (d.name === RtRp[i].name) {
                            return d;
                        }
                    }
                    for (var i = 0; i < RtRpM.length; i++) {
                        var nodo = RtRpM[i];
                        if (d.name === RtRpM[i].name) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
        }
        if (d3.select("#Retweets").property("checked" === true)) {
            link.filter(function(d) {
                    for (var i = 0; i < eRpM.length; i++) {
                        if (d === eRpM[i]) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
            node.filter(function(d) {
                    for (var i = 0; i < RpM.length; i++) {
                        var nodo = RpM[i];
                        if (d.name === RpM[i].name) {
                            return d;
                        }
                    }
                    for (var i = 0; i < RtRpM.length; i++) {
                        var nodo = RtRpM[i];
                        if (d.name === RtRpM[i].name) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
        }
        if (d3.select("#Replies").property("checked" === true)) {
            link.filter(function(d) {
                    for (var i = 0; i < eRtM.length; i++) {
                        if (d === eRtM[i]) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
            node.filter(function(d) {
                    for (var i = 0; i < RtM.length; i++) {
                        var nodo = RtM[i];
                        if (d.name === RtM[i].name) {
                            return d;
                        }
                    }
                    for (var i = 0; i < RtRpM.length; i++) {
                        var nodo = RtRpM[i];
                        if (d.name === RtRpM[i].name) {
                            return d;
                        }
                    }
                })
                .style("opacity", 1);
        }
    });

    //Muestra los nombres del top10
    var top10Labels = 0;
    d3.select("#et").on("click", function(d) {
        if (top10Labels === 0) {
            text.transition(350)
                .style("opacity", 1);
            top10Labels = 1;
        } else if( top10Labels === 1 ) {
            text.transition(350)
                .style("opacity", 0);
            top10Labels = 0;
        } 
    });

    //Resalta el componente más grande de la red, oculta los demás
    var giantComponent = 0;
    d3.select("#p").on("click", function(d) {
        if ( giantComponent === 0 ) {
            nodos = gComponent(mostMentioned);
            node.filter(function(n){
                    for (var i = 0; i < nodos.length; i++){
                        var nodo = nodos[i];
                        if(n.name!==nodo){
                            return n;
                        }
                    }
                })
                .transition(600)
                .style("opacity",0);
            node.filter(function(n){
                    for (var i = 0; i < nodos.length; i++){
                        var nodo = nodos[i];
                        if(n.name===nodo){
                            return n;
                        }
                    }
                })
                .transition(600)
                .style("opacity",1);
            link.filter(function(l){
                        for(var i = 0; i < nodos.length; i++){
                            var nodo = nodos[i];
                            if(nodo!==l.source.name | nodo !==l.target.name){
                                return l;
                            }
                        }
                    })
                .transition(600)
                .style("opacity",0);
            link.filter(function(l){
                        for(var i = 0; i < nodos.length; i++){
                            var nodo = nodos[i];
                            if(nodo===l.source.name | nodo ===l.target.name){
                                return l;
                            }
                        }
                    })
                .transition(600)
                .style("opacity",1);
            d3.selectAll("input").property("checked", true);
            howMany = 3;
            giantComponent = 1;
        }
        else{
            node
                .transition(600)
                .style("opacity",1);
            link
                .transition(600)
                .style("opacity",1);
            giantComponent=0;}
    });

    //Crea una lista de adyacencia: {[Nodo1: vecino1,..., vecino n],...,[Nodon]}
    adjacencyList={};
    nodes.forEach(function(d){
        neighborhood=[];
        adjacencyList[d.name]=neighborhood;
        nodes.forEach(function(n){
            if(neighboring(d,n) | neighboring(n,d) && n !== d){
                neighborhood.push(n.name);
            }
        });
    });

    
    console.log("Links.length= "+links.length);

    //Encuentra el componente más grande
    function gComponent(d){
        var level={}, i=1, frontier=[d];
        level[d]=0;
        while (frontier.length>0){
            var next=[];
            frontier.forEach(function(n){
                var neighbors = adjacencyList[n];
                neighbors.forEach(function(a){
                    if(!(a in level)){
                        level[a]=i;
                        next.push(a);
                    }
                });
            });
            frontier=next;
            i+=1; 
        }
        vecindad=[];
        Object.keys(level).forEach(function(k){
            vecindad.push(k);
        })
        return vecindad;
    }

    // //Checa cuántos checkboxes están activos y ejecuta una función para mostrar/esconder interacciones
    // var howManyLinks = 3;
    // d3.selectAll("#selectorsNodes input[type=checkbox]").on("click", function() {
    //     if (this.checked == true) {
    //         howManyLinks++;
    //     } else if (this.checked == false && howManyLinks > 0) {
    //         howManyLinks--;
    //     } else if (howManyLinks < 0) {
    //         howManyLinks = 0;
    //     }
    //     hidingNodes();
    // });

    // function hidingNodes(){
    //     d3.selectAll("#selectorsNodes input")
    //     .each(function(d){
    //         if (howManyLinks === 0) {
    //             node.style("opacity", 0);
    //             link.style("opacity", 0);
    //         }
    //         else if (howManyLinks===2 && d3.select("#Politicos").property("checked") === true && d3.select("#Medios").property("checked") === true) {
    //             link.filter(function(l){
    //                 if(l.source.class==="medio"){
    //                     console.log("HOLA :D");
    //                 }
    //             })
    //         }
    //     });
    // }

    //Encuentra el nodo solicitado por el usuario y lo selecciona junto con su vecindario
    function buscar(){
        nodes.forEach(function(d){
            var userInput=document.getElementById("buscador");
            var str1=d.name, str2=userInput.value
            if(str1.toLowerCase()===str2.toLowerCase()){
                connectedNodes(d);
            }
        });
    }

    //Ejecuta la búsqueda de un nodo al hace clic en el botón Buscar
    d3.select("#buscar").on("click", function(d) {
            buscar();
    });

    //Sugiere opciones a partir de lo escrito en el input de búsqueda
    $(function(){
        var tags = [];
        nodes.forEach(function(d){
            tags.push(d.name);
            return tags;
        });
        $('#buscador').autocomplete({
            source: tags
        });
    });

});