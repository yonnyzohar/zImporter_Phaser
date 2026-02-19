# zImporter

The `zImporter` is a TypeScript package designed to import and manage graphical hierarchies created in **zStudio**. This package allows seamless integration of assets and scenes built in **zStudio** into your JavaScript or TypeScript-based projects, particularly those using **Phaser**.

## Features

* Import and manage scenes and graphical hierarchies from **zStudio**
* Works with **Phaser** to display and interact with imported assets
* Provides a flexible and easy-to-use API for handling assets and scenes.

* Download zStudios to get started: https://zstudiosltd.com/

## Installation

To install the `zImporter` package from the npm registry:

```bash
npm install zimporter-phaser@1.0.40
```

Or to always get the latest version:

```bash
npm install zimporter-phaser@latest
```

> **Note:** Your `tsconfig.json` should include:

```json
"module": "ESNext",
"moduleResolution": "bundler"
```

## HTML Setup

To use zImporter in a browser environment, include the following scripts in your HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>zImporter Phaser Example</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.js"></script>
    <!-- Load your compiled zImporter bundle -->
    <script src="./dist/zimporter-phaser.min.js"></script>
    <!-- Spine plugin for Phaser -->
    <script src="./node_modules/@esotericsoftware/spine-phaser/dist/iife/spine-phaser.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }
        #game-container {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script>
        // Your Phaser game code here
    </script>
</body>
</html>
```

Make sure to configure the Spine plugin in your Phaser game config:

```javascript
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: GameScene,
    backgroundColor: 0x000000,
    plugins: {
        scene: [{
            key: 'SpinePlugin',
            plugin: spine.SpinePlugin,
            mapping: 'spine'
        }]
    }
};
```

## Building
npm run package

## Usage

### Importing zImporter into Your Project

You can find an example project here:
[https://github.com/yonnyzohar/zImporter\_Phaser\_Example](https://github.com/yonnyzohar/zImporter_Phaser_Example)

Basic import:

```ts
import { ZTimeline } from 'zimporter-phaser';
```

### Example: Creating a New Phaser Game

```ts
import Phaser from 'phaser';
import * as spine from '@esotericsoftware/spine-phaser';
import { ZSceneStack, ZUpdatables } from 'zimporter-phaser';

class GameScene extends Phaser.Scene {
  preload() {
    // Load your assets here
  }

  create() {
    ZSceneStack.init(this);
    ZUpdatables.init(24);
    // Your game initialization code
  }

  update(time: number, delta: number) {
    ZUpdatables.update();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  backgroundColor: 0x000000,
  plugins: {
    scene: [{
      key: 'SpinePlugin',
      plugin: spine.SpinePlugin,
      mapping: 'spine'
    }]
  }
};

const game = new Phaser.Game(config);
```

> This sets up a Phaser game and integrates zImporter's update system.

### Example: Loading and Displaying a Scene from zStudio

```ts
import Phaser from 'phaser';
import { ZScene, ZSceneStack, ZTimeline } from 'zimporter-phaser';

class GameScene extends Phaser.Scene {
  create() {
    const scene = new ZScene();
    scene.load('./assets/robo/', () => {
      ZSceneStack.push(scene);
      const mc = ZSceneStack.spawn('RobotWalker') as ZTimeline;
      mc.play();
      this.add.existing(mc);
      mc.x = 100;
      mc.y = 200;
    });
  }
}
```

### Example: Loading a Stage Created in zStudio

```ts
import Phaser from 'phaser';
import { ZScene, ZSceneStack } from 'zimporter-phaser';

class GameScene extends Phaser.Scene {
  create() {
    const loadPath = (window as any).loadPath;
    const scene = new ZScene('testScene');
    scene.load(loadPath, () => {
      ZSceneStack.push(scene);
      scene.loadStage(this);
    });
  }
}
```

> Each `ZScene` has a stage associated with it. This preserves the position and orientation logic defined in **zStudio**. Always add the scene stage to the scene.

## API

The package exposes several classes and methods for interacting with imported assets:

### `ZScene`

* Container for your entire scene.
* Handles screen resizing.
* Allows spawning of assets or loading full stages.

### `ZContainer`

* Core class for all visual elements.
* Extends `Phaser.GameObjects.Container` and adds:

  * Anchoring support
  * Orientation data from zStudio
* Set `.resizeable = false` to disable responsive behavior.

#### `Working with Text`
  In ZStudio, texts are always wrapper in a container, and are called "label" by default.
  If you know a specific container holds a text fields, you can acces it via:
  `getTextField():Phaser.GameObjects.Text | null`
  You can also set a string on the text via the container using:
  `setText(text:string):void`

### `ZButton`

* Extends `ZContainer`.
* Has `.enable()` / `.disable()` methods.
* Supports child containers with special names:

  * `upState`, `downState`, `overState`, `disabledState`, `labelContainer`

> When these are defined in **zStudio**, the button works automatically.

### `ZTimeline`

* Extends `ZContainer`.
* Manages frame-based timeline animations.
* API includes:

  * `.play()`, `.stop()`
  * `.gotoAndPlay(frameNum)`, `.gotoAndStop(frameNum)`
  * `.addStateEndEventListener(cb)`, `.removeStateEndEventListener(cb)`

### `ZState`

* Extends `ZContainer`.
* Only one child is visible at a time.
* Use `.setState(name: string)` to switch visible content.
* Can contain nested `ZTimeline` objects.

## Contributing

We welcome contributions!
To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request.

Please follow the existing code style and add tests where relevant.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
