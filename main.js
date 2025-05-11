const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const http = require("http");

const { PORT } = require("./config.js");

let mainWindow;
let serverProcess;

function createWindow() {
  const serverUrl = `http://localhost:${PORT}`;
  console.log(`URL: ${serverUrl}`);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const checkServerAndLoadApp = () => {
    http
      .get(serverUrl, (response) => {
        if (response.statusCode === 200) {
          mainWindow.loadURL(serverUrl);
          mainWindow.webContents.openDevTools();
        } else {
          setTimeout(checkServerAndLoadApp, 500);
        }
      })
      .on("error", () => {
        setTimeout(checkServerAndLoadApp, 500);
      });
  };

  serverProcess = spawn("npm", ["start"], {
    shell: true,
    env: process.env,
    stdio: "inherit",
  });

  setTimeout(checkServerAndLoadApp, 1000);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (serverProcess) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
      } else {
        serverProcess.kill();
      }
    }
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("quit", () => {
  if (serverProcess) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
    } else {
      serverProcess.kill();
    }
  }
});
