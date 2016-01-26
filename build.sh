#!/bin/bash

DIST_DIR=dist
NAME="WebSauce"
VERSION=`python -c 'import json;print(json.load(open("src/manifest.json"))["version"])'`
echo $VERSION

if [ $1 = "develop" ]; then
	NAME=$NAME-develop
else
	NAME=$NAME-$VERSION
fi
DEST=$DIST_DIR/$NAME

function render_svg {
	convert -resize $2x$2 -background none src/images/$1.svg $DEST/images/$1_$2x$2.png
}

function render_main_icon {
	if [ -f src/images/icon.svg ]; then
		render_svg icon 16
		render_svg icon 19
		render_svg icon 32
		render_svg icon 38
		render_svg icon 48
		render_svg icon 128
	fi
}

function action_icon {
	render_svg $1 19
	render_svg $1 38
}

rm -rf $DEST/*
mkdir -p $DEST
mkdir -p $DEST/images
mkdir -p build

# A list of files to be included.
CET_CP="manifest.json background.js websauce.js editor.html editor.js wf include"

if [ "$1" = "develop" ]; then
	for file in $CET_CP; do
		echo $file
		ln -sv $(pwd)/src/$file $DEST/$file
	done

	render_main_icon
else
	for file in $CET_CP; do
		echo $file
		cp -v src/$file $DEST/$file
	done

	render_main_icon

	cd dist/
	zip -r $NAME.zip $NAME/*
	cd ../
fi