/*:
 * @plugindesc v1.0.1 - Allows customize the cursor.
 *
 * @param cursor
 * @desc cursor image filename without extension
 * @default cursor
 *
 * @param extension
 * @desc cursor image extension
 * @default .png
 *
 * @param directory
 * @desc cursor image(s) directory
 * @default system
 *
 * @param animated
 * @desc defines whether the cursor its animated
 * @default false
 *
 * @param speed
 * @desc defines the cursor animation speed
 * @default 60
 *
 * @param frames
 * @desc defines the cursor animation frames
 * @default 8
 *
 * @help
 *
 * To customize the cursor, just place its image(s) in any "img" subfolder of
 * the project, even a custom subfolder like "system/cursor". Then, configure
 * this plugin by setting the cursor image(s) data as defined in the list below:
 *
 *    - cursor: cursor image filename
 *    - extension: cursor image(s) extension (with dot)
 *    - directory: cursor image(s) directory
 *    - animated: defines whether the cursor its animated (true / false)
 *    - speed: defines the cursor animation speed in milliseconds (higher values = more slow)
 *    - frames: defines the animation frames number
 *
 * If you configure an animated cursor, you must place its frames at the same
 * folder and rename them with the same name and end it with underscore and a
 * number. For example: cursor_0, cursor_1, cursor_2, cursor_n... Further, you
 * must set "frames" param with the number of animation images.
 *
 * All images must have the same extension.
 */

'use strict';

(function () {

    let CustomCursor = {
        cursor: PluginManager.parameters('CustomCursor')['cursor'],
        extension: PluginManager.parameters('CustomCursor')['extension'],
        directory: PluginManager.parameters('CustomCursor')['directory'],
        animated: PluginManager.parameters('CustomCursor')['animated'] === 'true',
        speed: Number(PluginManager.parameters('CustomCursor')['speed'], 60),
        frames: Number(PluginManager.parameters('CustomCursor')['frames'], 8),
        cursorLayer: null,

        initialize: function () {
            this.createCursorLayer();
            if (this.cursorLayer !== null) {
                if (this.animated) {
                    this.setAnimatedCursor();
                } else {
                    this.setStaticCursor();
                }
            } else {
                throw Error('Cursor layer is not defined!');
            }
        },

        createCursorLayer: function () {
            this.cursorLayer = document.createElement('div');
            this.cursorLayer.style.position = 'fixed';
            this.cursorLayer.style.top = '0';
            this.cursorLayer.style.left = '0';
            this.cursorLayer.style.width = '100%';
            this.cursorLayer.style.height = '100%';
            this.cursorLayer.style.zIndex = '2000';

            document.getElementsByTagName('body')[0].appendChild(this.cursorLayer);
        },

        setAnimatedCursor: function () {
            let index = 0;
            let cc = this;
            setInterval(function () {
                cc.setStaticCursor(index);
                index++;
                if (index > (cc.frames - 1)) {
                    index = 0;
                }
            }, this.speed)
        },

        setStaticCursor: function (index) {
            if (typeof index === 'undefined') {
                index = this.extension;
            } else {
                index = '_' + index + this.extension;
            }
            this.cursorLayer.style.cursor = 'url("img/' + this.directory + '/' + this.cursor + index + '"), auto';
        }
    };

    window.addEventListener('load', function () {
        CustomCursor.initialize();
    });
})();
