import { PumpVoltage, RGBState } from "./LCT21001";

export const aquarisAPIHandle = 'aquarisAPIHandle';

export class ClientAPI {

    constructor(private ipc: Electron.IpcRenderer, private apiHandle: string) {}

    public connect(deviceUUID: string) { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.connect.name, deviceUUID]); }
    public disconnect() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.disconnect.name]); }
    public isConnected() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.isConnected.name]) as Promise<boolean>; }
    public readFwVersion() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.readFwVersion.name]) as Promise<string>; }
    public writeRGB(red: number, green: number, blue: number, state: RGBState | number) { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writeRGB.name, red, green, blue, state]); }
    public writeRGBOff() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writeRGBOff.name]); }
    public writeFanMode(dutyCyclePercent: number) { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writeFanMode.name, dutyCyclePercent]); }
    public writeFanOff() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writeFanOff.name]); }
    public writePumpMode(dutyCyclePercent: number, voltage: PumpVoltage | number) { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writePumpMode.name, dutyCyclePercent, voltage]); }
    public writePumpOff() { return this.ipc.invoke(this.apiHandle, [ClientAPI.prototype.writePumpOff.name]); }
}

export function registerAPI (ipcMain: Electron.IpcMain, apiHandle: string, mainsideHandlers: Map<string, (...args: any[]) => any>) {

    ipcMain.handle(apiHandle, async (event, args: any[]) => {
        const mainsideFunction = mainsideHandlers.get(args[0]);
        if (mainsideFunction === undefined) {
            throw Error(apiHandle + ': Undefined API function');
        } else {
            return mainsideFunction.call(this, ...args.slice(1));
        }
    });
}

export function unregisterAPI(ipcMain: Electron.IpcMain, apiHandle: string) {
    ipcMain.removeHandler(apiHandle);
}
