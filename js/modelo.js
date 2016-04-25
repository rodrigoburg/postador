var chave_planilha = "1LlwXjsOKimdDIJOI8AoUzwnFuFKO8_bKXfSYZC4vPL4" //link do modelo
//var chave_planilha = "15rYAFLkga7NQrt4B_pzkhMriXRAw3uij5NzH34XQYpw" //link do modelo

/**
 * Created by rodrigoburg on 09/02/15.
 */
var id_grafico = chave_planilha.substr(25).replace("_","").replace("-","")

var width = $("body").width()* 0.9
var height = 550
var margins = {
    bottom:110,
    left:70,
    right:70,
    top:80
}

var pagina = null
var baixar = {}
var url_base = "https://spreadsheets.google.com/feeds/cells/"+chave_planilha+"/"
var url_final = "/public/values?alt=json"
var primeiro = true;

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

var le_planilha = function(d) {
    var cells = d.feed.entry; // d são os dados recebidos do Google...
    var numCells = cells.length;
    var cellId, cellPos , conteudo;
    var celulas = {}
    var titulos = {};

    for(var i=0; i < numCells; i++) {

        // lê na string do id a coluna e linha
        cellId = cells[i].id.$t.split('/');
        cellPos = cellId[cellId.length - 1].split('C');
        cellPos[0] = cellPos[0].replace('R', '');
        conteudo = cells[i].content.$t

        if (cellPos[0] == "1") {
            titulos[cellPos[1]] = conteudo

        } else {
            if (!(cellPos[0] in celulas)) {
                celulas[cellPos[0]] = {}
            }
            celulas[cellPos[0]][titulos[cellPos[1]]] = conteudo
        }
    }
    return celulas
}

var baixa_planilha_dados = function (sheet, callback) {
    $.getJSON(url_base+sheet+url_final, function  (d) {
        var dados = le_planilha(d)
        var saida = []
        for (key in dados) {
            var item = dados[key]
            saida.push(item)
        }
        if (callback) callback(saida)
    })
}

var iniciar = function() {
    $.getJSON(url_base + 1 + url_final, function (d) {
        pagina = le_planilha(d)
        cria_tags()
        for (index in baixar) {
            desenha_grafico(baixar[index])
        }
    })
}

var cria_tags = function (callback) {
    var ListView = Backbone.View.extend({
        el: $('body'), // attaches `this.el` to an existing element.

        initialize: function() {
            _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
            this.pagina = window.pagina
            this.render(); // not all views are self-rendering. This one is.
        },

        render: function() {
            var el = $(this.el)
            var contador_graficos = 0
            for (key in this.pagina) {
                var item = pagina[key]
                if ("assinatura" in item) {
                    var assinatura = item["assinatura"].split("<P>")
                    for (a in assinatura) {
                        el.append("<p class=assinatura>"+assinatura[a]+"</p>")
                    }
                    el.append("<hr class=assinatura>")
                }

                if ("titulo" in item) {
                    if (primeiro) {
                        primeiro = false;
                    } else {
                        el.append("<hr>") //adiciona barra horizontal se não for o primeiro
                    }                    
                    el.append("<p class=titulo>"+item["titulo"]+"</p>")
                }
                if ("texto" in item) {
                    var texto = item["texto"].split("<P>")
                    for (t in texto) {
                        el.append("<p class=texto>"+texto[t]+"</p>")
                    }
                }
                if ("leia_mais" in item) {
                    var leia_mais = item["leia_mais"].split("<P>")
                    el.append("<p class=leia_mais>Leia mais:")
                    el.append("<ul>")
                    for (l in leia_mais) {
                        var texto = leia_mais[l].split(" - ")[0]
                        var link = leia_mais[l].split(" - ")[1]
                        el.append("<li><a target=blank' href='"+link+"'>"+texto+"</a></li>")
                    }
                    el.append("</ul>")
                    el.append("</p>")
                }
                if ("num_planilha_dados" in item) {
                    var index = item["num_planilha_dados"]
                    el.append("<div id="+id_grafico+contador_graficos+" class=grafico></div>")
                    baixar[contador_graficos] = {
                        contador:contador_graficos,
                        posicao:index,
                        tipo_grafico:item["tipo_grafico"],
                        titulo_grafico:item["titulo_grafico"],
                        x:item["x"],
                        tipo_x:item["tipo_x"],
                        y:item["y"],
                        tipo_y:item["tipo_y"],
                        serie:item["serie"],
                        legenda:item["legenda"],
                        ordem_legenda:item["ordem_legenda"],
                        cores:item["cores"],
                        ordem_x:item["ordem_x"],
                        outros:item["outros"]
                    },
                    contador_graficos++
                }

                el.append("<br>")
            }
        }
    });

    var listView = new ListView();
    if (callback) callback()

}
window.grafico = null
function desenha_grafico(item) {
    baixa_planilha_dados(item["posicao"], function (dados) {
        var tipo_grafico = item["tipo_grafico"],
            titulo_grafico = item["titulo_grafico"],
            x = item["x"],
            tipo_x = item["tipo_x"],
            y = item["y"],
            tipo_y = item["tipo_y"],
            serie = item["serie"],
            legenda = item["legenda"],
            ordem_legenda = (item["ordem_legenda"]) ? item["ordem_legenda"].split(",") : null,
            index = item["contador"],
            cores = (item["cores"]) ? item["cores"].split(",") : null,
            ordem_x = (item["ordem_x"]) ? item["ordem_x"].split(",") : null,
            outros_inicial = (item["outros"]) ? item["outros"].split(",") : null

        var outros = {}
        if (outros_inicial) {
            for (i in outros_inicial) {
                var temp = outros_inicial[i].split("=")
                outros[temp[0]] = temp[1]
            }
        }
        var cores_default = [
            "#A11217",
            "#BA007C",
            "#5E196F",
            "#00408F",
            "#007CC0",
            "#009493",
            "#00602D",
            "#A3BD31",
            "#E9BC00",
            "#634600"
        ]

        var svg = dimple.newSvg("#"+id_grafico+index,width,height)
        var myChart = new dimple.chart(svg, dados);


        myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
        if (tipo_x == "valor") {
            var x = myChart.addMeasureAxis("x", x);
        } else if (tipo_x == "categorico" || tipo_x == "categórico" || tipo_x == "categoria" || tipo_x == "categorica" || tipo_x == "categórica") {
            var x = x.split(",")
            var x = myChart.addCategoryAxis("x", x);
        } else if (tipo_x == "time" || tipo_x == "tempo") {
            if (outros) {
                if ("entrada_tempo" in outros && "saida_tempo" in outros) {
                    var entrada_tempo = outros["entrada_tempo"]
                    var saida_tempo = outros["saida_tempo"]
                    var x = myChart.addTimeAxis("x",x,entrada_tempo,saida_tempo)
                } else chama_erro("Faltou determinar a entrada e saída do formato de tempo na coluna 'Outros'")
            } else chama_erro("Faltou determinar a entrada e saída do formato de tempo na coluna 'Outros'")
        }

        if (ordem_x) {
            x.addOrderRule(ordem_x)
            x.addGroupOrderRule(ordem_x)
        }

        if (tipo_y == "valor") {
            var y = myChart.addMeasureAxis("y", y);
        } else if (tipo_y == "categorico" || tipo_y == "categórico" || tipo_y == "categoria" || tipo_y == "categorica" || tipo_y == "categórica") {
            var y = myChart.addCategoryAxis("y", y);
        }

        if (outros) {
            if ("min_y" in outros) {
                y.overrideMin(parseInt(outros["min_y"]))
            } else if ("max_y" in outros) {
                y.overrideMax(parseInt(outros["max_y"]))
            } else if ("min_x" in outros) {
                x.overrideMin(parseInt(outros["min_x"]))
            } else if ("max_x" in outros) {
                x.overrideMax(parseInt(outros["max_x"]))
            }
        }

        x.fontSize = "12px"
        y.fontSize = "12px"

        //y.overrideMax = 20000000000.0

        var lista_series = []

        if (serie) {
            lista_series = serie.split(",")
        }

        if (tipo_grafico == "bar" || tipo_grafico == "barra") {
            var s = myChart.addSeries(lista_series, dimple.plot.bar);
        } else if (tipo_grafico == "linha" || tipo_grafico == "line") {
            var s = myChart.addSeries(lista_series, dimple.plot.line);
        } else if (tipo_grafico == "dispersão" || tipo_grafico == "dispersao" || tipo_grafico == "scatter") {
            var s = myChart.addSeries(lista_series, dimple.plot.bubble);
        }

        if (outros) {
            if ("interpolar" in outros) {
                s.interpolation = outros["interpolar"]
            }
        }
        console.log(titulo_grafico,dados)


        if (cores) {
            for (c in cores) {
                var temp = cores[c].split("=")                
                if (temp[1].substring(0,1) == '#') {
                    myChart.assignColor(temp[0],temp[1])
                } else {
                    myChart.assignColor(temp[0],cores_default[temp[1]])
                }                
            }

        } else {
            var cores_ = []
            for (c in cores_default) {
                cores_.push(new dimple.color(cores_default[c]))
            }
            myChart.defaultColors = shuffle(cores_);
        }
        //s.stacked = false
        //series.lineWeight = 1.8;
        if (legenda == "sim" || legenda == "Sim" || legenda == "SIM") {
            legenda = myChart.addLegend(margins.left+10,margins.top-20, width-margins.right, 200)
            if (ordem_legenda) {
                legenda._getEntries = function () {
                    var orderedValues = ordem_legenda;
                    var entries = [];
                    orderedValues.forEach(function (v) {
                        v = v.trim()
                        entries.push(
                            {
                                key: v,
                                fill: myChart.getColor(v).fill,
                                stroke: myChart.getColor(v).stroke,
                                opacity: myChart.getColor(v).opacity,
                                series: s,
                                aggField: [v]
                            }
                        );
                    }, this);

                    return entries;
                };

            }
        }

        myChart.draw();
        window.grafico = myChart
        console.log($("body").height()+30)

        if (titulo_grafico)
            coloca_titulo(svg,myChart,titulo_grafico)

        if (outros) {
            if ("remove_titulo" in outros) {
                var temp = outros["remove_titulo"].split(",")
                for (i in temp) {
                    if (temp[i] == "x") {
                        x.titleShape.remove()
                    } else if (temp[i] == "y") {
                        y.titleShape.remove()
                    }
                }
            }
            if ("tira_label" in outros) {
                var temp = outros["tira_label"].split(",")
                for (i in temp) {
                    if (temp[i] == "x") {
                        x.shapes.selectAll("text").remove();
                    } else if (temp[i] == "y") {
                        y.shapes.selectAll("text").remove();
                    }
                }
            }
            if ("traslada" in outros) {
                //translada labels do eixo x
                x.shapes.selectAll("text").attr("transform",
                    function (d) {
                        //return d3.select(this).attr("transform") + " translate(-14, 38) rotate(-90)";
                        return d3.select(this).attr("transform") + " translate(0, 20) rotate(-45)";
                    }
                );
            }
            if ("traslada90" in outros) {
                //translada labels do eixo x
                x.shapes.selectAll("text").attr("transform",
                    function (d) {
                        //return d3.select(this).attr("transform") + " translate(-14, 38) rotate(-90)";
                        return d3.select(this).attr("transform") + " translate(70, 120) rotate(-90)";
                    }
                );
            }

        }

    })
}

function coloca_titulo(svg,grafico,titulo_grafico) {
    svg.append("text")
        .attr("x", grafico._xPixels() + grafico._widthPixels() / 2)
        .attr("y", grafico._yPixels() - 45)
        .attr("class","titulo_grafico")
        .text(titulo_grafico);
}

function chama_erro(erro) {
    alert("ERRO: "+erro)
}

iniciar()

