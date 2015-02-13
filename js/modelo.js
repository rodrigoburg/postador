/**
 * Created by rodrigoburg on 09/02/15.
 */
var dados = null
var width = 500
var height = 500
var margins = {
    bottom:70,
    left:50,
    right:70,
    top:20
}
var grafico = null
var pagina = null
var baixar = {}
var lista_graficos = 0

var chave_planilha = "1oG6YX-OUU4wcIjMKbcaX7htfOQkwQRP6HWcUx4dvhlk"
var url_base = "https://spreadsheets.google.com/feeds/cells/"+chave_planilha+"/"
var url_final = "/public/values?alt=json"
// ao carregar os dados da planilha...

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
    var feed = $.getJSON(url_base+sheet+url_final, function  (d) {
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
    var feed = $.getJSON(url_base+1+url_final, function  (d){
        pagina = le_planilha(d)
        cria_tags()
        for (index in baixar) {
            baixa_planilha_dados(baixar[index], function (dados) {
                desenha_grafico(dados)
            })
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
                if ("texto" in item) {
                    el.append("<p class=texto>"+item["texto"]+"</p>")
                }
                if ("num_planilha_dados" in item) {
                    var index = item["num_planilha_dados"]
                    el.append("<div id=grafico"+contador_graficos+"></div>")
                    baixar[contador_graficos] = index
                    contador_graficos++
                }
            }
        }
    });

    var listView = new ListView();
    if (callback) callback()

}

function desenha_grafico(dados) {
    var index = window.lista_graficos
    window.lista_graficos++

    var svg = dimple.newSvg("#grafico"+index, width, height);
    var myChart = new dimple.chart(svg, dados);


    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", "ano");
    x.title = ""
    var y = myChart.addMeasureAxis("y", "gasto_fies");
    //y.overrideMax = 20000000000.0

    var series = myChart.addSeries(null, dimple.plot.bar);
    //series.lineWeight = 1.8;

    myChart.draw();

    //translada labels do eixo x
    /*x.shapes.selectAll("text").attr("transform",
        function (d) {
            return d3.select(this).attr("transform") + " translate(0, 15) rotate(-60)";
    });*/

    window.grafico = myChart
}

iniciar()

