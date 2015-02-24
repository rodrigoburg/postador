/**
 * Created by rodrigoburg on 09/02/15.
 */
var width = $("body").width()* 0.75
var height = 500
var margins = {
    bottom:70,
    left:50,
    right:70,
    top:40
}

var pagina = null
var baixar = {}

var chave_planilha = "1oG6YX-OUU4wcIjMKbcaX7htfOQkwQRP6HWcUx4dvhlk"
var url_base = "https://spreadsheets.google.com/feeds/cells/"+chave_planilha+"/"
var url_final = "/public/values?alt=json"

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
                    el.append("<div id=grafico"+contador_graficos+"></div>")
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
            }
        }
    });

    var listView = new ListView();
    if (callback) callback()

}

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
            index = item["contador"],
            outros = (item["outros"]) ? item["outros"].split(",") : null

        var svg = dimple.newSvg("#grafico"+index, width, height);
        var myChart = new dimple.chart(svg, dados);


        myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
        if (tipo_x == "valor") {
            var x = myChart.addMeasureAxis("x", x);
        } else if (tipo_x == "categorico" || tipo_x == "categórico" || tipo_x == "categoria" || tipo_x == "categorica" || tipo_x == "categórica") {
            var x = myChart.addCategoryAxis("x", x);
        }

        if (tipo_y == "valor") {
            myChart.addMeasureAxis("y", y);
        } else if (tipo_y == "categorico" || tipo_y == "categórico" || tipo_y == "categoria" || tipo_y == "categorica" || tipo_y == "categórica") {
            myChart.addCategoryAxis("y", y);
        }
        //y.overrideMax = 20000000000.0

        var lista_series = []

        if (serie) {
            lista_series = serie.split(",")
        }
        if (tipo_grafico == "bar" || tipo_grafico == "barra") {
            myChart.addSeries(lista_series, dimple.plot.bar);
        } else if (tipo_grafico == "linha" || tipo_grafico == "line") {
            myChart.addSeries(lista_series, dimple.plot.line);
        } else if (tipo_grafico == "dispersão" || tipo_grafico == "dispersao" || tipo_grafico == "scatter") {
            myChart.addSeries(lista_series, dimple.plot.bubble);
        }

        //series.lineWeight = 1.8;
        if (legenda == "sim" || legenda == "Sim" || legenda == "SIM") {
            myChart.addLegend(margins["left"]+10,10, 300, 200)
        }

        myChart.defaultColors = [
            new dimple.color("#95AFBA"),
            new dimple.color("#C2C094"),
            new dimple.color("#B89685"),
            new dimple.color("#FFC09F"),
            new dimple.color("#E0D3DE")

        ]
            myChart.draw();

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
        .attr("y", grafico._yPixels() - 20)
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .text(titulo_grafico);
}

iniciar()

