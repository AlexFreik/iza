.PHONY: *

all:
	make start

install:
	npm install

pretty:
	npx prettier --write .

dev:
	npm start

css:
	npx tailwindcss -i src/input.css -o src/output.css --watch
