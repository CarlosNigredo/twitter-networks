//EXPERIMENTOS PARA FILTRAR EL GRAFO
d3.json("data/HoyNoCircula/hoy_no_circula_Apr202016_filtro.json", function(data) {

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
    nodes = d3.values(nodeset);

    //Calcula el grado de salida y el de entrada de cada nodo
    nodes.forEach(function(d) {
        d.inDegree = 0;
        links.forEach(function(d1) {
            if (d == d1.target)
                d.inDegree++;
        });
        d.outDegree = 0;
        links.forEach(function(d1) {
            if (d == d1.source)
                d.outDegree++;
        });
    });

    //Ordena los nodos de mayor a menor según su grado de entrada
    nodes.sort(function(a, b) {
        if (a.inDegree < b.inDegree) {
            return 1;
        } else if (a.inDegree > b.inDegree) {
            return -1;
        } else {
            return 0;
        }
    });

    //Crea listas y muestras de nodos 
    var topNodes = [];//Lista de los 30 primeros nodos
    var nodesSample = [];//Muestra de los 30 más sus vecinos
    var nodeList = [];//Lista con los NOMBRES de los 30 primeros nodos
    for (var i = 0; i < 30; i++) {
        var este = nodes[i].name;
        nodeList.push(este);
        nodesSample.push(nodes[i]);
        topNodes.push(nodes[i]);
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

    //Crea una lista de adyacencia: {[Nodo1: vecino1,..., vecino n],...,[Nodon]}
    adjacencyListTotal={};
    nodes.forEach(function(d){
        neighborhood=[];
        adjacencyListTotal[d.name]=neighborhood;
        nodes.forEach(function(n){
            if(neighboring(d,n) | neighboring(n,d) && n !== d){
                neighborhood.push(n.name);
            }
        });
    });

    //Añade los vecinos de los 30 primeros a nodesSample
    nodeList.forEach(function(n){
        Object.keys(adjacencyListTotal).forEach(function(k){
            if(n===k){
                adjacencyListTotal[k].forEach(function(a){
                    nodes.forEach(function(d){
                        if(d.name===a){
                        nodesSample.push(d);
                        }
                    });
                });
            }
        });
    });

    //Ordena nodesSample
    nodesSample.sort(function(a, b) {
        if (a.name > b.name) {
            return 1;
        } else if (a.name < b.name) {
            return -1;
        } else {
            return 0;
        }
    });

    //Elimina duplicados de nodesSample
    var duplicados=0;
    for(var i=0; i<nodesSample.length; i++){
        if(i!==0 && nodesSample[i].name===nodesSample[i-1].name){
            duplicados+=1;
            nodesSample.splice(i-1,1);
            i-=1;
        }
    }

    console.log("Número de cuentas (total): "+nodes.length + " , Número de interacciones (total): " + links.length);

    nodes=nodesSample;

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

    //Crea una muestra de los links que unen a los 30 primeros + vecinos
    totalInteractions=[];
    links.forEach(function(l){
        Object.keys(adjacencyList).forEach(function(k){
            if(l.source.name===k){
                adjacencyList[k].forEach(function(d){
                    if(l.target.name===d){
                        totalInteractions.push(l);
                    }
                })
            }
        });
    });

    //Crea una muestra de los links que unen a los 30 primeros + vecinos
    linksSample=[];
    links.forEach(function(l){
        Object.keys(adjacencyList).forEach(function(k){
            if(l.source.name===k){
                adjacencyList[k].forEach(function(d){
                    if(l.target.name===d){
                        linksSample.push(l);
                    }
                })
            }
        });
    });
    
    links=linksSample;

    //Calcula el grado de salida y el de entrada de cada nodo en la muestra final
    nodes.forEach(function(d) {
        d.inDegree=0;
        links.forEach(function(d1) {
            if (d == d1.target)
                d.inDegree++;
        });
        d.outDegree=0;
        links.forEach(function(d1) {
            if (d == d1.source)
                d.outDegree++;
        });
    });

    console.log("Número de cuentas (filtrado): "+nodes.length + " , Número de interacciones (filtrado): " + links.length);

    var numRT=0, numRP=0, numMen=0;
    links.forEach(function(l){
        if(l.interaction==="retweet"){
            numRT++;
        }
        else if(l.interaction==="reply"){
            numRP++;
        }
        if(l.interaction==="mention"){
            numMen++;
        }
    });

    var porRT=((numRT*100)/links.length).toFixed(2);
    var porRP=((numRP*100)/links.length).toFixed(2);
    var porMen=((numMen*100)/links.length).toFixed(2);

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

    linksWeight=links;
    for(var i=0;i<linksWeight.length;i++){
        if (i != 0 &&
            linksWeight[i].source.name === linksWeight[i - 1].source.name &&
            linksWeight[i].target.name === linksWeight[i - 1].target.name && 
            linksWeight[i].interaction === linksWeight[i-1].interaction){
                linksWeight.splice(i-1,1);
                i-=1;
        }
    }

    console.log("Número de enlaces: "+linksWeight.length);

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

        var numCiu=0,numMed=0,numPol=0;

        nodes.forEach(function(n){
            if(n.class==="ciudadano"){
                numCiu++;
            }
            else if(n.class==="medio"){
                numMed++;
            }
            else if(n.class==="politico"){
                numPol++;
            }
        });

        var porCiu=((numCiu*100)/nodes.length).toFixed(2);
        var porMed=((numMed*100)/nodes.length).toFixed(2);
        var porPol=((numPol*100)/nodes.length).toFixed(2);

        console.log("Ciudadanos: "+numCiu+"("+porCiu+"%)"+", Medios: "+numMed+"("+porMed+"%)"+", Politicos: "+numPol+"("+porPol+"%)");
        console.log("Retuits: "+numRT+"("+porRT+"%)"+", Respuestas: "+numRP+"("+porRP+"%)"+", Menciones: "+numMen+"("+porMen+"%)");
        console.log(" ");
        console.log("TABLA DE NODOS");
        // topNodes.forEach(function(n){
        //     console.log(n.name+", "+n.class+", GE: "+n.inDegree+", GS: "+n.outDegree);
        // });
        for(var i=0;i<10;i++){
            console.log(topNodes[i].name+", "+topNodes[i].class+", GE: "+topNodes[i].inDegree+", GS: "+topNodes[i].outDegree);
        }

        //Distribución de nodos en RETUITS
        var nodesRT=0, rtMedios=0, rtPoliticos=0, rtCiudadanos=0;
        nodes.forEach(function(n){
            if(n.retweeting){
                nodesRT++;
                if(n.class==="medio"){
                    rtMedios++;
                }
                else if(n.class==="politico"){
                    rtPoliticos++;
                }
                else if(n.class==="ciudadano"){
                    rtCiudadanos++;
                }
            }
        });
        var porRtCiu=((rtCiudadanos*100)/nodesRT).toFixed(2);
        var porRtMed=((rtPoliticos*100)/nodesRT).toFixed(2);
        var porRtPol=((rtMedios*100)/nodesRT).toFixed(2);

        //Distribución de nodos en REPLIES
        var nodesRP=0, rpMedios=0, rpPoliticos=0, rpCiudadanos=0;
        nodes.forEach(function(n){
            if(n.replying){
                nodesRP++;
                if(n.class==="medio"){
                    rpMedios++;
                }
                else if(n.class==="politico"){
                    rpPoliticos++;
                }
                else if(n.class==="ciudadano"){
                    rpCiudadanos++;
                }
            }
        });

        var porRpCiu=((rpCiudadanos*100)/nodesRP).toFixed(2);
        var porRpMed=((rpPoliticos*100)/nodesRP).toFixed(2);
        var porRpPol=((rpMedios*100)/nodesRP).toFixed(2);

        //Distribución de nodos en MENCIONES
        var nodesMn=0, mnMedios=0, mnPoliticos=0, mnCiudadanos=0;
        nodes.forEach(function(n){
            if(n.mentioning){
                nodesMn++;
                if(n.class==="medio"){
                    mnMedios++;
                }
                else if(n.class==="politico"){
                    mnPoliticos++;
                }
                else if(n.class==="ciudadano"){
                    mnCiudadanos++;
                }
            }
        });

        var porMnCiu=((mnCiudadanos*100)/nodesMn).toFixed(2);
        var porMnMed=((mnPoliticos*100)/nodesMn).toFixed(2);
        var porMnPol=((mnMedios*100)/nodesMn).toFixed(2);

        var intraActores=[],interActores=[];
        var intraRt=0, intraRp=0, intraMn=0;
        var interRt=0, interRp=0, interMn=0;

        totalInteractions.forEach(function(l){
            if(l.source.class===l.target.class){
                intraActores.push(l);
                if(l.interaction==="retweet"){
                    intraRt++;
                }
                else if(l.interaction==="reply"){
                    intraRp++;
                }
                else if(l.interaction==="mention"){
                    intraMn++;
                }
            }
            else if(l.source.class!==l.target.class){
                interActores.push(l);
                if(l.interaction==="retweet"){
                    interRt++;
                }
                else if(l.interaction==="reply"){
                    interRp++;
                }
                else if(l.interaction==="mention"){
                    interMn++;
                }
            }
        });

        var intraC=0, intraP=0, intraM=0;
        var intraCRt=0, intraCRp=0; intraCM=0;
        var intraMRt=0, intraMRp=0; intraMM=0;
        var intraPRt=0, intraPRp=0; intraPM=0;
        intraActores.forEach(function(l){
            if(l.source.class==="ciudadano"&&l.target.class==="ciudadano"){
                intraC++;
                if(l.interaction==="retweet"){
                    intraCRt++;
                }
                else if(l.interaction==="reply"){
                    intraCRp++;
                }
                else if(l.interaction==="mention"){
                    intraCM++;
                }
            }
            else if(l.source.class==="medio"&&l.target.class==="medio"){
                intraM++;
                if(l.interaction==="retweet"){
                    intraMRt++;
                }
                else if(l.interaction==="reply"){
                    intraMRp++;
                }
                else if(l.interaction==="mention"){
                    intraMM++;
                }
            }
            else if(l.source.class==="politico"&&l.target.class==="politico"){
                intraP++;
                if(l.interaction==="retweet"){
                    intraPRt++;
                }
                else if(l.interaction==="reply"){
                    intraPRp++;
                }
                else if(l.interaction==="mention"){
                    intraPM++;
                }
            }
        });

        var interCM=0, interCP=0, interPM=0;
        var interCMRt=0, interCMRp=0, interCMM=0;
        var interCPRt=0, interCPRp=0, interCPM=0;
        var interPMRt=0, interPMRp=0, interPMM=0;
        interActores.forEach(function(l){
            if((l.source.class==="ciudadano"&&l.target.class==="medio") || (l.source.class==="medio"&&l.target.class==="ciudadano")){
                interCM++;
                if(l.interaction==="retweet"){
                    interCMRt++;
                }
                else if(l.interaction==="reply"){
                    interCMRp++;
                }
                else if(l.interaction==="mention"){
                    interCMM++;
                }
            }
            else if((l.source.class==="ciudadano"&&l.target.class==="politico") || (l.source.class==="politico"&&l.target.class==="ciudadano")){
                interCP++;
                if(l.interaction==="retweet"){
                    interCPRt++;
                }
                else if(l.interaction==="reply"){
                    interCPRp++;
                }
                else if(l.interaction==="mention"){
                    interCPM++;
                }
            }
            else if((l.source.class==="politico"&&l.target.class==="medio") || (l.source.class==="medio"&&l.target.class==="politico")){
                interPM++;
                if(l.interaction==="retweet"){
                    interPMRt++;
                }
                else if(l.interaction==="reply"){
                    interPMRp++;
                }
                else if(l.interaction==="mention"){
                    interPMM++;
                }
            }
        });

        console.log(" ");
        console.log("DISTRIBUCIÓN DE NODOS POR TIPO DE INTERACCION")
        console.log("Retuits: "+"C="+porRtCiu+"%("+rtCiudadanos+"), SM="+porRtMed+"%("+rtMedios+"), SP="+porRtPol+"%("+rtPoliticos+")");
        console.log("Respuestas: "+"C="+porRpCiu+"%("+rpCiudadanos+"), SM="+porRpMed+"%("+rpMedios+"), SP="+porRpPol+"%("+rpPoliticos+")");
        console.log("Menciones: "+"C="+porMnCiu+"%("+mnCiudadanos+"), SM="+porMnMed+"%("+mnMedios+"), SP="+porMnPol+"%("+mnPoliticos+")");
        console.log(" ");
        console.log("INTRA-ACTORES: "+intraActores.length+"("+((intraActores.length*100)/totalInteractions.length).toFixed(2)+"% del total de interacciones)");
        console.log("Retuits: "+intraRt+", Respuestas: "+intraRp+", Menciones: "+intraMn);
        console.log("Intra-Ciudadanos: "+intraC+" (Retuits: "+intraCRt+", Respuestas: "+intraCRp+", Menciones: "+intraCM+")");
        console.log("Intra-Medios: "+intraM+" (Retuits: "+intraMRt+", Respuestas: "+intraMRp+", Menciones: "+intraMM+")");
        console.log("Intra-Politicos: "+intraP+" (Retuits: "+intraPRt+", Respuestas: "+intraPRp+", Menciones: "+intraPM+")");
        console.log(" ");
        console.log("INTER-ACTORES: "+interActores.length+"("+((interActores.length*100)/totalInteractions.length).toFixed(2)+"% del total de interacciones)");
        console.log("Retuits: "+interRt+", Respuestas: "+interRp+", Menciones: "+interMn);
        console.log("Inter Ciudadanos-Medios: "+interCM+" (Retuits: "+interCMRt+", Respuestas: "+interCMRp+", Menciones: "+interCMM+")");
        console.log("Inter Ciudadanos-Politicos: "+interCP+" (Retuits: "+interCPRt+", Respuestas: "+interCPRp+", Menciones: "+interCPM+")");
        console.log("Inter Politicos-Medios: "+interPM+" (Retuits: "+interPMRt+", Respuestas: "+interPMRp+", Menciones: "+interPMM+")");

        var wPie = 200;
        var hPie = 200;
        var dataset = [ numCiu, numMed, numPol ];
        var outerRadius = wPie / 2;
        var innerRadius = outerRadius-30;
        var arc = d3.svg.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius);
        
        var pie = d3.layout.pie();
        
        //Easy colors accessible via a 10-step ordinal scale
        // var color = d3.scale.category10();
        var color = ["#808993","#00B7EB","#FF1493"]
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

        //Checa cuántos checkboxes están activos y ejecuta una función para mostrar/esconder nodos
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

        nodes.forEach(function(n){
            Object.keys(adjacencyList).forEach(function(v){
                if(n.name===v && n.class==="medio"){
                    adjacencyList[v].forEach(function(d){
                        nodes.forEach(function(e){
                            if(e.name===d){
                                e.vDeM=true;
                            }
                        });
                    });
                }
                else if(n.name===v && n.class==="ciudadano"){
                    adjacencyList[v].forEach(function(d){
                        nodes.forEach(function(e){
                            if(e.name===d){
                                e.vDeC=true;
                            }
                        });
                    });
                }
                else if(n.name===v && n.class==="politico"){
                    adjacencyList[v].forEach(function(d){
                        nodes.forEach(function(e){
                            if(e.name===d){
                                e.vDeP=true;
                            }
                        });
                    });
                }
            });
        });

        //La selección de dos tipos de nodos muestra tanto los enlaces intra- como los inter-categoría
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
                        if(n.class==="ciudadano"){
                            return n;
                        }
                        else if(n.class==="medio" && n.vDeC===true && n.vDeM===undefined && n.vDeP===undefined){
                            return n;
                        }
                        else if(n.class==="politico" && n.vDeC===true && n.vDeM===undefined && n.vDeP===undefined){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
                else if (howManyLinks===2 && d3.select("#Politicos").property("checked") === true && d3.select("#Ciudadanos").property("checked") === true) {
                    link.filter(function(l){
                        if(l.source.class==="medio" || l.target.class==="medio"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        if(n.class==="medio"){
                            return n;
                        }
                        else if(n.class==="ciudadano" && n.vDeM===true && n.vDeC===undefined && n.vDeP===undefined){
                            return n;
                        }
                        else if(n.class==="politico" && n.vDeM===true && n.vDeC===undefined && n.vDeP===undefined){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
                else if (howManyLinks===2 && d3.select("#Medios").property("checked") === true && d3.select("#Ciudadanos").property("checked") === true) {
                    link.filter(function(l){
                        if(l.source.class==="politico" || l.target.class==="politico"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        if(n.class==="politico"){
                            return n;
                        }
                        else if(n.class==="ciudadano" && n.vDeP===true && n.vDeC===undefined && n.vDeM===undefined){
                            return n;
                        }
                        else if(n.class==="medio" && n.vDeP===true && n.vDeC===undefined && n.vDeM===undefined){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
                else if(howManyLinks===1 && d3.select("#Medios").property("checked") === true){
                    link.filter(function(l){
                        if(l.source.class==="medio" && l.target.class==="medio"){
                            return l;
                        }
                    })
                        .style("opacity",1);
                    link.filter(function(l){
                        if(l.source.class!=="medio" || l.target.class!=="medio"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        if(n.class==="medio" && n.vDeP===undefined && n.vDeC===undefined && n.vDeM===true){
                            return n;
                        }
                    })
                        .style("opacity",1);
                    node.filter(function(n){
                        if(n.class!=="medio"){
                            return n;
                        }
                        else if(n.class==="medio" && n.vDeP===true && n.vDeC===true && n.vDeM===undefined){
                            return n;
                        }
                        else if(n.class==="medio" && n.vDeP===true && n.vDeC===undefined && n.vDeM===undefined){
                            return n;
                        }
                        else if(n.class==="medio" && n.vDeP===undefined && n.vDeC===true && n.vDeM===undefined){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
                else if(howManyLinks===1 && d3.select("#Politicos").property("checked") === true){
                    link.filter(function(l){
                        if(l.source.class==="politico" && l.target.class==="politico"){
                            return l;
                        }
                    })
                        .style("opacity",1);
                    link.filter(function(l){
                        if(l.source.class!=="politico" || l.target.class!=="politico"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        if(n.class==="politico" && n.vDeP===true && n.vDeC===undefined && n.vDeM===undefined){
                            return n;
                        }
                    })
                        .style("opacity",1);
                    node.filter(function(n){
                        if(n.class!=="politico"){
                            return n;
                        }
                        else if(n.class==="politico" && n.vDeP===undefined && n.vDeC===true && n.vDeM===true){
                            return n;
                        }
                        else if(n.class==="politico" && n.vDeP===undefined && n.vDeC===undefined && n.vDeM===true){
                            return n;
                        }
                        else if(n.class==="politico" && n.vDeP===undefined && n.vDeC===true && n.vDeM===undefined){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
                else if(howManyLinks===1 && d3.select("#Ciudadanos").property("checked") === true){
                    link.filter(function(l){
                        if(l.source.class==="ciudadano" && l.target.class==="ciudadano"){
                            return l;
                        }
                    })
                        .style("opacity",1);
                    link.filter(function(l){
                        if(l.source.class!=="ciudadano" || l.target.class!=="ciudadano"){
                            return l;
                        }
                    })
                        .style("opacity",0);
                    node.filter(function(n){
                        if(n.class==="ciudadano" && n.vDeP===undefined && n.vDeC===true && n.vDeM===undefined){
                            return n;
                        }
                    })
                        .style("opacity",1);
                    node.filter(function(n){
                        if(n.class!=="ciudadano"){
                            return n;
                        }
                        else if(n.class==="ciudadano" && n.vDeP===true && n.vDeC===undefined && n.vDeM===true){
                            return n;
                        }
                        else if(n.class==="ciudadano" && n.vDeP===true && n.vDeC===undefined && n.vDeM===undefined){
                            return n;
                        }
                        else if(n.class==="ciudadano" && n.vDeP===undefined && n.vDeC===undefined && n.vDeM===true){
                            return n;
                        }
                    })
                        .style("opacity",0);
                }
            });
        }

        //Checa qué checkboxes se desactivan y muestra enlaces, con sus respectivos nodos, según tipo de interacción
        d3.selectAll("#selectorsNodes input").on("mouseup", function(d) {
            if (d3.select("#Ciudadanos").property("checked" === false && howManyLinks===2)) {
                link.filter(function(l){
                        if(l.source.class==="ciudadano" || l.target.class==="ciudadano"){
                            return l;
                        }
                    })
                    .style("opacity",1);
                node.style("opacity",1);
            }
            if (d3.select("#Medios").property("checked" === false && howManyLinks===2)) {
                link.filter(function(l){
                        if(l.source.class==="medio" || l.target.class==="medio"){
                            return l;
                        }
                    })
                        .style("opacity",1);
                    node.style("opacity",1);
            }
            if (d3.select("#Politicos").property("checked" === false && howManyLinks===2)) {
                link.filter(function(l){
                        if(l.source.class==="politico" || l.target.class==="politico"){
                            return l;
                        }
                    })
                        .style("opacity",1);
                    node.style("opacity",1);
            }

        });
    });

    /*======================================================================
    ANITALAVALATINANITALAVALATINANITALAVALATINANITALAVALATINANITALAVALATINA
    ======================================================================*/

    /*Tamaño del SVG*/
    var width = $(window).width();
    height = $(window).height();

    /*Tipo de visualización*/
    var force = d3.layout.force()
        // .charge(100)//-100
        .charge(function(d) {
            return (d.inDegree + 1) * (-500);
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
            return "<span style='color:white'>" + d.name + " | GE:" + d.inDegree + " GS:" + d.outDegree + "</span>";
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
        .links(linksWeight)
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
        .style("marker-end", "url(#flecha)")
        // .on("mouseover",function(d){
        //     linkLabel.style("opacity",1);
        //     // .on("mouseout",function)
        // })
        // .on("mouseout",function(d){
        //     linkLabel.style("opacity",0);
        //     // .on("mouseout",function)
        // })
        ;

    var linkLabel = vis.selectAll(".label")
        .data(links)
        .enter().append("text")
        .attr("dx",0)
        .attr("dy",0)
        .attr("class","label")
        .text(function(d){
            if(d.replies>1){
                return d.replies;
            }
            else if(d.retuits>1){
                return d.retuits;
            }
            else if(d.mentions>1){
                return d.mentions;
            }
        })
        .style("opacity",0);

    var marker = vis.selectAll("marker")
        .data(links)
        .enter().append("marker")
        .attr("id", "flecha")
        .attr("viewBox", "0 -8 16 16")
        .attr("refX", 15)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 10)
        .attr("markerHeight", 15)
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

        linkLabel.attr("x",function(d){
                return (d.source.x + d.target.x)/2;
            })
            .attr("y",function(d){
                return (d.source.y + d.target.y)/2;
                // return d.source.y;
            })
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
    d3.select("#enlaces2").on("click", function(d) {
        if (cambio === 0 && howMany===3) {
            link.transition(600)
                .style("opacity", 0);
            cambio = 1;
            howMany = 0;
            d3.selectAll("#selectors input[type=checkbox]").property("checked", false);
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
                    d3.selectAll("#enlaces2").property("checked", false);
                    cambio=1;
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
    d3.selectAll("#selectors label").on("mouseup", function(d) {
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
                d3.selectAll("#enlaces2").property("checked", true);
                cambio=0;
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
                d3.selectAll("#enlaces2").property("checked", true);
                cambio=0;
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
                d3.selectAll("#enlaces2").property("checked", true);
                cambio=0;
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

    d3.select("#degree").on("click",function(d){
        setSize();
    })

    var cambiaTamanio=0;
    function setSize() {
        if (cambiaTamanio === 0) {
            nodes.forEach(function(d) {
                baseRadius = (Math.sqrt(1 / Math.PI)) * 5;
                baseNodeArea = Math.PI * (baseRadius * baseRadius);
                if (d.outDegree > 0) {
                    d.radius = Math.sqrt((baseNodeArea * (d.outDegree * 1.7)) / Math.PI);
                } else {
                    d.radius = baseRadius;
                }
            });
            node.attr("r",function(n){
                return n.radius;
            })
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
            cambiaTamanio = 1;
            console.log("in");
        } else {
            nodes.forEach(function(d) {
                baseRadius = (Math.sqrt(1 / Math.PI)) * 5;
                baseNodeArea = Math.PI * (baseRadius * baseRadius);
                if (d.inDegree > 0) {
                    d.radius = Math.sqrt((baseNodeArea * (d.inDegree * 1.7)) / Math.PI);
                } else {
                    d.radius = baseRadius;
                }
            });
            node.attr("r",function(n){
                return n.radius;
            })

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
            cambiaTamanio = 0;
            console.log("out");
        }
    }

    var cambiaFondo=0;
    function changeBackground(){
        if(cambiaFondo===0){
            d3.select("body").style("background-color","#F2F3F4");
            marker.attr("stroke", "#fff")
                .attr("fill","#000"); 
            linkLabel.attr("class","label2");
            text.attr("class","text2");
            cambiaFondo=1;
        }
        else if(cambiaFondo===1){
            d3.select("body").style("background-color","#14141c");
            marker.attr("stroke", "#14141c")                
                .attr("fill", "#F2F3F4");
            linkLabel.attr("class","label");
            text.attr("class","text");
            cambiaFondo=0;
        }
    }

    var pesoEnlaces=0;
    function muestraPeso(){
        if(pesoEnlaces===0){
            linkLabel.style("opacity",1);
            pesoEnlaces=1;
        }
        else if(pesoEnlaces===1){
            linkLabel.style("opacity",0);
            pesoEnlaces=0;
        }
    }

    var enlacesBi=0;
    function muestraEnlacesBi(){
        if(enlacesBi===0){
            link.style("opacity",0);
            var linksCurvos=[];
            var linksBi=[];
            links.forEach(function(l){
                if(l.straight===0){
                    linksCurvos.push(l);
                }
            }); 
            link.filter(function(l){
                for(var i=0;i<linksCurvos.length;i++){
                    if(l.source===linksCurvos[i].target && l.target===linksCurvos[i].source){
                        linksBi.push(l);
                        return l;
                    }
                }
            })
                .style("opacity",1);
            node.style("opacity",0);
            node.filter(function(n){
                for(var i=0;i<linksBi.length;i++){
                    if(n.name===linksBi[i].source.name || n.name===linksBi[i].target.name){
                            return n;
                    }
                }
            })
                .style("opacity",1);
            enlacesBi=1;
        }
        else if(enlacesBi===1){
            link.style("opacity",1);
            node.style("opacity",1);
            enlacesBi=0;
        }
        
    };

    d3.select("#bidirect").on("click",function(d){
        muestraEnlacesBi();
    })

    d3.select("#enlaces").on("click", function(d) {
            muestraPeso();
        });


    d3.select("#background").on("click", function(d) {
            changeBackground();
    });

});