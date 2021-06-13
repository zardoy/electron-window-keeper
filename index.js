"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableTrackingOfFileNames = void 0;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
/**
 * By default, this module trying to help you with tracking fileNames when creating new class instances and raising an **error** when you use the same file path twice.
 *
 * I think it shouldn't create any problems, until someone realise how to use HMR in Electron.
 *
 * Set this to `true` before the first class created to disable it.
 * @default false */
exports.disableTrackingOfFileNames = false;
const propsToPreserve = {
    numeric: ["x", "y", "width", "height"],
    boolean: ["fullscreen", "maximized"]
};
const usedFilePaths = new Set();
class ElectronWindowKeeper {
    constructor(options = {}) {
        var _a;
        this.options = options;
        // todo use lodash.defaults or something like that
        const { clearInvalidConfig = true, fileName = "window-state", ...restOptions } = options;
        const customFileOrPathSet = "fileName" in options || "cwd" in options;
        const defaultCwd = electron_1.app.getPath("userData");
        // https://github.com/sindresorhus/electron-store/tree/main/index.js#L60
        const cwd = restOptions.cwd ?
            path_1.default.isAbsolute(restOptions.cwd) ? restOptions.cwd : path_1.default.join(defaultCwd, restOptions.cwd) :
            defaultCwd;
        const filePath = path_1.default.join(cwd, `${fileName}.${(_a = restOptions.fileExtension) !== null && _a !== void 0 ? _a : "json"}`);
        // todo learn english or how to specify more user-friendly messages
        if (usedFilePaths.has(filePath))
            throw new Error(`This file (${customFileOrPathSet ? "default values" : filePath}) was already used for another window. Please, specify another file name via "fileName" constructor option or disable tracking of used file names via "disableTrackingOfFileNames" named export.`);
        usedFilePaths.add(filePath);
        // try to type store
        this.electronStore = new electron_store_1.default({
            clearInvalidConfig,
            name: fileName,
            schema: {
                ...Object.fromEntries(propsToPreserve.numeric.map(prop => [prop, {
                        type: "number",
                        minimum: 0
                    }])),
                ...Object.fromEntries(propsToPreserve.boolean.map(prop => [prop, {
                        type: "boolean"
                    }]))
            },
            ...restOptions
        });
        this.filePath = this.electronStore.path;
        this.restoredFullState = lodash_1.pick(this.electronStore.store, [...propsToPreserve.numeric, ...propsToPreserve.boolean]);
        this.restoredState = lodash_1.omit(this.restoredFullState, "maximized");
    }
    manuallySaveState(browserWindow) {
        const bounds = lodash_1.mapValues(browserWindow.getBounds(), value => lodash_1.clamp(value, 0, Infinity));
        this.electronStore.set({
            ...bounds,
            fullscreen: browserWindow.isFullScreen(),
            maximized: browserWindow.isMaximized()
        });
    }
    /**
     * Like in electron-window-state, it sets maximized state (if not disabled) and watches for movement/resizing the window
     */
    manage(browserWindow) {
        var _a;
        // fullscreen controlled via prop
        const { maximized: maximizedConfig } = this.options;
        if (maximizedConfig !== false) {
            // todo test false option
            if ("maximized" in this.restoredFullState) {
                if (this.restoredFullState.maximized)
                    browserWindow.maximize();
            }
            else {
                if ((_a = maximizedConfig === null || maximizedConfig === void 0 ? void 0 : maximizedConfig.default) !== null && _a !== void 0 ? _a : true)
                    browserWindow.maximize();
            }
        }
        const updateState = lodash_1.debounce(() => this.manuallySaveState(browserWindow), 500);
        browserWindow.on("move", updateState);
        browserWindow.on("resize", updateState);
    }
}
exports.default = ElectronWindowKeeper;
