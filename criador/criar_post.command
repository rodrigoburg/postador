#!/bin/bash          
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
echo ""
echo "Descompactando arquivos..."
echo ""
mkdir $DIR/postador
unzip -q $DIR/postador.zip -d $DIR/postador
echo "Arquivos descompactados!"
echo ""
echo "Por favor, coloque a chave da sua tabela do Google Drive"
echo "Exemplo: no link https://docs.google.com/spreadsheets/d/1oG6YX-OUU4wcIjMKbcaX7htfOQkwQRP6HWcUx4dvhlk/edit#gid=0..."
echo "...a chave seria 1oG6YX-OUU4wcIjMKbcaX7htfOQkwQRP6HWcUx4dvhlk"
echo ""
read key
echo 'var chave_planilha = "'$key'"' | cat - $DIR'/postador/js/modelo.js' > $DIR/temp && mv $DIR/temp $DIR'/postador/js/modelo.js'
echo ""
echo 'Chave '$key' adicionada ao arquivo. Agora, digite o nome da página a ser criada:'
echo ""
read nome
mv $DIR/postador $DIR/$nome
echo ""
echo 'Ok. Tentando subir no servidor. Coloque o password quando for pedido.'
echo ""
scp -r $DIR/$nome/ edados@estadaodados.com:~/www/blog/projs
echo ""
echo 'Se deu certo, o link para o post é blog.estadaodados.com/projs/'$nome
rm -r $DIR/$nome