# Electron Window Keeper

The most maintained module for persisting Electron window state. Also note, that I'm going to make this module super easy to use in all possible cases where you need complicated window state persistence.

Available to use in main process only.

[API](https://paka.dev/npm/electron-window-keeper)

## Usage

The usage as simple as it should be:

```ts
import ElectronWindowKeeper from "electron-window-keeper";
import { app, BrowserWindow } from "electron";

app.on("ready", () => {
    const windowState = new ElectronWindowKeeper();
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        // always position defaults (x, y, width, height, fullscreen) above
        ...windowState.restoredState
    });
    windowState.manage(window);
});
```

If you don't understand `...` (spread syntax) you can read [javascript.info guide](https://javascript.info/rest-parameters-spread).

To disable tracking of maximized state pass `trackMaximized: false`.

To disable tracking of fullscreen state just pass `fullscreen: false` right after *restoredState*:

```ts
new BrowserWindow({
    // default props
    ...windowState.restoredState,
    fullscreen: false // always override restored fullscreen value
});
```

Also note, that as stated in [BrowserWindow docs](https://www.electronjs.org/docs/api/browser-window#using-ready-to-show-event), setting minimum or maximum window size doesn't prevent setting it from restored state.

## TODO

- [ ] tests. again, I'm too lazy to setup it now
- [ ] describe behavior when multiple app instances are launched (last resized window would override the state)

## Notes

[Electron memento](https://npmjs.com/electron-memento) was really close to finalize the idea, but this module is meant to be more modern and comprehensive.

Also note, that to bring the window to top without gaining the focus you can specify `alwaysOnTop: true` when creating new `BrowserWindow` and on just created window call `browserWindow.setAlwaysOnTop(false)`. But never use it on production! It would be annoying to the user.
