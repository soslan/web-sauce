#!/bin/bash

DIST_DIR=dist
NAME="web-sauce"
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
mkdir -p $DIST_DIR/promo

# A list of files to be included.
CET_CP="manifest.json background.js editor.html editor.js"

if [ "$1" = "develop" ]; then
	for file in $CET_CP; do
		echo $file
		ln -sv $(pwd)/src/$file $DEST/$file
	done
	ln -sv $(pwd)/vendor/wf $DEST/wf
	ln -sv $(pwd)/vendor/jquery $DEST/jquery
	ln -sv $(pwd)/vendor/codemirror $DEST/codemirror

	render_main_icon
else
	for file in $CET_CP; do
		echo $file
		cp -v src/$file $DEST/$file
	done
	cp -rv vendor/wf $DEST/wf
	cp -rv vendor/codemirror $DEST/codemirror
	cp -rv vendor/jquery $DEST/jquery

	render_main_icon

	convert -background none src/images/promo_440x280.svg $DIST_DIR/promo/promo_440x280.png
	#convert -background none src/images/promo_920x680.svg $DIST_DIR/promo/promo_920x680.png
	#convert -background none src/images/promo_1400x560.svg $DIST_DIR/promo/promo_1400x560.png


	cd dist/
	zip -r $NAME.zip $NAME/*
	cd ../
fi
