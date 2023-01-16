/*:
 * @plugindesc v1.0.0 - Allows overwrite, expand and configure gamepads controllers.
 *
 * @param enableKeyboard
 * @desc Enables or disables keyboard.
 * @default true
 *
 * @param enableMouse
 * @desc Enables or disables the mouse.
 * @default true
 *
 * @param joyLeftPush
 * @desc For left joystick push.
 *
 * @param joyRightPush
 * @desc For right joystick push.
 *
 * @param padUp
 * @desc For up d-pad button.
 * @default up
 *
 * @param padRight
 * @desc For right d-pad button.
 * @default right
 *
 * @param padDown
 * @desc For down d-pad button.
 * @default down
 *
 * @param padLeft
 * @desc For left d-pad button.
 * @default left
 *
 * @param Y
 * @desc For Y button.
 *
 * @param B
 * @desc For B button.
 * @default cancel
 *
 * @param A
 * @desc For A button.
 * @default ok
 *
 * @param X
 * @desc For X button.
 *
 * @param back
 * @desc For menu/back button.
 * @default escape
 *
 * @param start
 * @desc For start main button.
 * @default menu
 *
 * @param leftButton
 * @desc For left up button.
 *
 * @param leftTrigger
 * @desc For left trigger.
 * @default pageup
 *
 * @param rightButton
 * @desc For right up button.
 * @default shift
 *
 * @param rightTrigger
 * @desc For right trigger.
 * @default pagedown
 *
 * @help
 *
 * Base configuration:
 *    enableKeyboard  # Enables or disables keyboard controls
 *    enableMouse     # Enables or disables mouse controls
 *
 * Buttons configuration:
 *    RPG MV includes some events by default to associate with gamepads controllers.
 *    This event list is:
 *       up           # Moves main character to up
 *       down         # Moves main character to down
 *       left         # Moves main character to left
 *       right        # Moves main character to left
 *       shift        # Accelerates the movement of the characters
 *       cancel       # Runs the cancellation event
 *       ok           # Runs the ok/acept event
 *       escape       # Runs the escape event
 *       menu         # Runs the menu event
 *       pageup       #
 *       pagedown     #
 *
 *    In addition to the default events, it's possible associate common events to
 *    execute them when a button is triggered. To do this, you just need set the
 *    common event name as button value param. For example, if we have a common
 *    event called "LANTERN" and we want activate it triggering the left button,
 *    we simply put "LANTERN" as value of "leftButton".
 *
 *    Also, we can run scripts, creating a common event with a plugin command
 *    event that triggers some action, and then, setting its name as in the
 *    previous example. For example, if we have the "ItemBook" default plugin
 *    active, we can create a common event called "ITEMBOOK" and add it a plugin
 *    command with "ItemBook open". Finally, we'll set "ITEMBOOK" as value of the
 *    button we want.
 */

'use strict';

(function () {

    Array.prototype.empty = function () {
        return this === null || this.length === 0;
    };

    let gamepadController = {
        parameters: null,
        eventsList: null,
        commonEventsCallables: [],

        initialize: function () {
            this.initilizeParameters();
            this.redefineGamepad();
            this.redefineSceneUpdate();
            this.redefineCommonEvent();

            if (this.parameters['enableKeyboard'] === 'false') {
                this.disableKeyboard();
            }

            if (this.parameters['enableMouse'] === 'false') {
                this.disableMouse();
            }
        },

        initilizeParameters: function () {
            let gc = this;
            this.parameters = PluginManager.parameters('GamepadConfigurer');
            this.eventsList = Object.keys(this.parameters).map(function (key) {
                return gc.parameters[key];
            });
        },

        disableKeyboard: function () {
            Input.keyMapper = {};
        },

        disableMouse: function () {
            TouchInput.update = function () {
            };
        },

        redefineGamepad: function () {
            if (typeof Input !== 'undefined') {
                Input.gamepadMapper = {
                    0: this.parameters['A'],
                    1: this.parameters['B'],
                    2: this.parameters['X'],
                    3: this.parameters['Y'],
                    4: this.parameters['leftButton'],
                    5: this.parameters['rightButton'],
                    6: this.parameters['leftTrigger'],
                    7: this.parameters['rightTrigger'],
                    8: this.parameters['back'],
                    9: this.parameters['start'],
                    10: this.parameters['joyLeftPush'],
                    11: this.parameters['joyRightPush'],
                    12: this.parameters['padUp'],
                    13: this.parameters['padDown'],
                    14: this.parameters['padLeft'],
                    15: this.parameters['padRight']
                };
            } else {
                throw new Error('Input gamepad not defined!');
            }
        },

        redefineSceneUpdate: function () {
            Scene_Map.prototype.updateGamepad = function () {
                gamepadController.updateCommonEventsCalls();
            };

            Scene_Map.prototype.updateScene = function () {
                this.checkGameover();
                if (!SceneManager.isSceneChanging()) {
                    this.updateTransferPlayer();
                }
                if (!SceneManager.isSceneChanging()) {
                    this.updateEncounter();
                }
                if (!SceneManager.isSceneChanging()) {
                    this.updateCallMenu();
                }
                if (!SceneManager.isSceneChanging()) {
                    this.updateCallDebug();
                }
                if (!SceneManager.isSceneChanging()) {
                    this.updateGamepad();
                }
            };
        },

        redefineCommonEvent: function () {
            Object.defineProperty(Game_CommonEvent, '_type', {
                value: 'default',
                writable: true,
                enumerable: true,
                configurable: true
            });

            Game_CommonEvent.prototype.initialize = function (commonEventId) {
                if (typeof commonEventId === 'object') {
                    this._commonEventId = commonEventId._commonEventId;
                    this._type = commonEventId._type;
                } else {
                    this._commonEventId = commonEventId;
                }
                this.refresh();
            };

            Game_CommonEvent.prototype.isActive = function () {
                if (this._type === 'default') {
                    let event = this.event();
                    return event.trigger === 2 && $gameSwitches.value(event.switchId);
                }
                return true;
            };
        },

        updateCommonEventsCalls: function () {
            if (this.commonEventsCallables.empty()) {
                this.loadCommonEventsCallables();
            }
            for (let button of this.commonEventsCallables) {
                if (Input.isTriggered(button.name)) {
                    this.executeCommonEvent(button.commonEventId);
                }
            }
        },

        loadCommonEventsCallables: function () {
            for (let commonEvent of $dataCommonEvents) {
                if (commonEvent !== null && this.commonEventBelongsToButton(commonEvent.name)) {
                    this.commonEventsCallables.push({
                        name: commonEvent.name,
                        commonEventId: commonEvent.id
                    });
                }
            }
        },

        commonEventBelongsToButton: function (commonEvent) {
            for (let button of this.eventsList) {
                if (button === commonEvent) {
                    return true;
                }
            }
        },

        executeCommonEvent: function (commonEventId) {
            let ce = new Game_CommonEvent({
                _commonEventId: commonEventId,
                _type: 'executable'
            });
            ce.update();
        }
    };

    gamepadController.initialize();
})();

