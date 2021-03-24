<p align="center">
   <img alt="Hicore"  src='./public/appIcon.png' width="150"  />
  </a>
</p>

**Hicore** is a free and open-source game server. it's based on **RUDP** protocol which suitable for Fast-paced games 🎮.
The server includes two parts one is Mothership Server which developed by Nodejs as manager and the other one is Child Server developed by Golang which controls all things inside the game like real-time stuff.

## Features

- **User Authentication**: Users can create account with email and device ID.
- **Social**: Users can add their friends and play together.
- **Matchmaking**: By matchmaking system players can play together base on there ranks and levels.
- **Real-time**: All communication inside game is based on RUDP protocol which is suitable for Fast-paced and any other games.
- **Storage**: We can save users data in the database like how many weapons they have and etc.
- **Static Storage**: Whit static storage we can save whatever we need for our game like shop items, weapons and etc.
- **Chat**: Users can chat together one by one or in rooms.
- **Dashboard**: With dashboard we can control all stuff in our game.

## Getting Started

The fastest and easiest way to get started is to run server with Docker.

## Docker

Make sure you are installed Docker and Docker compose. The full documentation for Hicore Server installation is available in the [guide](https://hicore.dev/installation/).

### Step 1: Clone Project

For deploying server you should first clone the repository from Github for doing this in the terminal window enter the command:

```bash
 git clone https://github.com/hicore/hicore.git
```

### Step 2: Create Docker Compose File

Create `docker-compose.yml` and put it in a project folder. You can see full [docker-compose](https://hicore.dev/installation/#step-2-change-docker-compose-file).

### Step 3: Run Docker Compose

After creating `docker-compose.yml`, you can simply build Docker container by using this command:

```bash
 docker-compose up --build
```

In this stage Docker starts creating container and then the server is ready to use and Hicore runs on your machine.
you can connect to the Mothership Server at `localhost:7192` and connect to the Child Server at `localhost:7100`

## Client

Hicore support Unity3D Engine, Unreal Engine will be added as soon as possible.
You can download Unity3D SDK from [release page](https://github.com/hicore/hicore-unity/releases) and for full documentation check [Unity client doc](https://hicore.dev/unity/).

## Dashboard

With dashboard you can control your game. The full documentation for Hicore dashboard installation is available in the [Dashboard installation](https://hicore.dev/dashboard-install/) and you can download it from [here](https://github.com/hicore/hicore-dashboard)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
