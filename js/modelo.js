var chave_planilha = "1P3LnfA-uA4EVCVHiPfqabLI-oCRHNf4Kb9UXoOk2Cbo" //link do modelo


//var chave_planilha = "12uJCNURJ-8AinCrLfzi24DKHhj6aFGMota46Z9hFkh0" //link do modelo
/**
 * Created by rodrigoburg on 09/02/15.
 */
var width = $("body").width()* 0.9
var height = 650
var margins = {
    bottom:200,
    left:60,
    right:70,
    top:80
}

var pagina = null
var baixar = {}
var url_base = "https://spreadsheets.google.com/feeds/cells/"+chave_planilha+"/"
var url_final = "/public/values?alt=json"

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
                if ("titulo" in item) {
                    el.append("<p class=titulo>"+item["titulo"]+"</p>")
                }
                if ("num_planilha_dados" in item) {
                    var index = item["num_planilha_dados"]
                    el.append("<div id=grafico"+contador_graficos+" class=grafico></div>")
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
                        outros:item["outros"]
                    },
                    contador_graficos++
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
                el.append("<hr><br>")
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
            ordem_legenda = item["ordem_legenda"].split(","),
            index = item["contador"],
            cores = item["cores"].split(","),
            outros = (item["outros"]) ? item["outros"].split(",") : null

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

        var svg = dimple.newSvg("#grafico"+index,width,height)
        var myChart = new dimple.chart(svg, dados);


        myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
        if (tipo_x == "valor") {
            var x = myChart.addMeasureAxis("x", x);
        } else if (tipo_x == "categorico" || tipo_x == "categórico" || tipo_x == "categoria" || tipo_x == "categorica" || tipo_x == "categórica") {
            var x = myChart.addCategoryAxis("x", x);
        } else if (tipo_x == "time" || tipo_x == "tempo") {
             var x = myChart.addTimeAxis("x",x,"%y","%y")
        }


        if (tipo_y == "valor") {
            var y = myChart.addMeasureAxis("y", y);
        } else if (tipo_y == "categorico" || tipo_y == "categórico" || tipo_y == "categoria" || tipo_y == "categorica" || tipo_y == "categórica") {
            var y = myChart.addCategoryAxis("y", y);
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
            if (outros.indexOf("interpolar_cardinal" > -1)) {
                s.interpolation = "cardinal"
            }
        }


        if (cores) {
            for (c in cores) {
                var temp = cores[c].split("=")
                myChart.assignColor(temp[0],cores_default[temp[1]])
            }

        } else {
            var cores = []
            for (c in cores_default) {
                cores.append(new dimple.color(cores_default[c]))
            }
            myChart.defaultColors = shuffle(cores);
        }

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
            if (outros.indexOf("tira_label_x") > -1) {
                x.shapes.selectAll("text").remove();
            }
            if (outros.indexOf("tira_label_y") > -1 ) {
                y.shapes.selectAll("text").remove();
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

iniciar()
