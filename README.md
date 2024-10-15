<img src="/artwork/CACAO-Roaster-logo.jpg" alt="CACAO Roaster logo" width="400"/>

**Online Instance:**[ https://mateusdz.github.io/AInception-roaster/](https://mateusdz.github.io/AInception-roaster/)

# CACAO Roaster Sub-Project

# Getting Started

These instructions will get you a copy of the project up and running on your local machine for development purposes. See deployment for notes on how to deploy the project on a live system.

Prerequisites:

-   node >= 20.5.0
-   npm >= 9.8.0

## Installation

```
npm i
```

**Run the project locally (in development mode)**

```
npm run start
```

The CACAO Roaster will run locally on: http://localhost:3000/

**Building the project for production**

```
npm run build
```

## Deployment

Install serve service on hosting machine

```
npm install serve
```

Host production bundle

```
serve dist
```

Or use [Docker](https://www.docker.com/) to spin up a fully functioning container

```
docker build -t cacao-roaster .
docker run -it -p 3000:3000 cacao-roaster
```
