##  Folder structure 

- public/  any front end resources,js,CSS,images,ect...

- views/ contains individual pages
- views/layouts contains the layout for how each page will render
- index.js is the main centerpoint of the application (everything will connect via index.js so this is where it all comes together.)
- lib/ is for any custom modules ( modules for querying a database or api)// need to have a app.js/any file inside this temporarily so git uploads it.

## What to install//NPM setup
- npm init -y (sets up package.json)
- npm i path express express-handlebars mongoose body-parser dotenv

## in index.js
require all the things we've downloaded

