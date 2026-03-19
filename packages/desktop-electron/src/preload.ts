import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktopShell", {
  async retryStart() {
    await ipcRenderer.invoke("desktop-shell:retry-start");
  },
});
