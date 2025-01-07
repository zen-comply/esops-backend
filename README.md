# express-wrapper
A wrapper reposiroty that includes ready to use docker and testing frameworks.

Components included:
1. Express
2. Testing framework
   1. Mocha - Testing framework
   2. Chai - For assertions
   3. Supertest - For api testing

# Steps to setup locally

Clone the repo and install the packages:

```
npm install
```

Then run the docker container:

```
docker-compose up --build
```

# Steps to test
- All tests should be stored under '__tests__' folder and should be suffixed with "*.test.js"
- A setup.js file is included in the tests folder for doing setup and tear down.
- Mocha configs are under `.mocharc.json`

```
npm test
```