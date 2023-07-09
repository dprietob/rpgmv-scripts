/*:
 * @plugindesc v1.0.0 - Sentinel system
 * @author Fizeir
 *
 * @param active
 * @desc flag that enables or disables the Sentinel System for all events (true or false)
 * @default true
 *
 * @help
 *
 * To set up an event as a sentinel, just add a Plugin Command event inside
 * an event page with:
 * 
 * sentinel_add {"side":2,"forward":7,"active":true,"selfSwitch":"A","gameSwitch":"gs1","gameVariables":{"name":"gv1","value":1}}
 * 
 * Important: The JSON parameter must not have spaces between the braces.
 * 
 * This will configure that event as Sentinel with the defined parameters:
 * 
 *      - side: tiles on either side of the event it will watch.
 *      - forward: tiles forward of the event it will watch.
 *      - active: activates or deactivates the sentinel system for that event.
 *      - selfSwitch: self switch that you want to be activated when the sentinel sees the player.
 *      - gameSwitch: game switch that you want to be activated when the sentinel sees the player.
 *      - gameVariable: game variable that you want to be updated when the sentinel sees the player. You must indicate the name and the value to set.
 * 
 * All parameters all optional, being their default value:
 * 
 *      - side: 2
 *      - forward: 7
 *      - active: true
 *      - selfSwitch: A
 *      - gameSwitch: null
 *      - gameVariable: null 
 * 
 * To enable or disable Sentinel events globally, make this call to the Plugin Command:
 * 
 * sentinel {"active":true}
 * 
 *      - active: can be true o false.
 * 
 * By default, "active" contains the value set by the Plugin Manager.
 */

(function () {
    const Sentinel = {
        active: PluginManager.parameters('Sentinel')['active'] == 'true',
        commandMain: "sentinel",
        commandAdd: "sentinel_add",
        mapEvents: [],
        sentinels: [],
        defaults: {
            "side": 2,
            "forward": 7,
            "active": true,
            "selfSwitch": "A",
            "gameSwitch": null,
            "gameVariable": null,
        },

        initialize: function () {
            this.redefineGameInterpreter();
            this.redefineGameEvent();
            this.redefineGameMap();
            this.redefineSceneMap();
        },

        redefineGameInterpreter: function () {
            Game_Interpreter.prototype.pluginCommand = function (command, args) {
                switch (command) {
                    case Sentinel.commandMain:
                        Sentinel.setActive(this, args);
                        break;

                    case Sentinel.commandAdd:
                        Sentinel.addSentinel(this, args);
                        break;
                }
            };
        },

        redefineGameEvent: function () {
            Game_Event.prototype.canSeePlayer = function () {
                var sx = this.deltaXFrom($gamePlayer.x);
                var sy = this.deltaYFrom($gamePlayer.y);
                var mx = this._sentinel.side;
                var my = this._sentinel.forward;

                switch (this._direction) {
                    case 2: // DOWN
                        return sx >= -mx && sx <= mx
                            && sy < 0 && sy >= -my;

                    case 4: // LEFT
                        return sx > 0 && sx <= my
                            && sy >= -mx && sy <= mx;

                    case 6: // RIGHT
                        return sx < 0 && sx >= -my
                            && sy >= -mx && sy <= mx;

                    case 8: // UP
                        return sx >= -mx && sx <= mx
                            && sy > 0 && sy <= my;

                }

                return false;
            };
        },

        redefineGameMap: function () {
            Game_Map.prototype.setup = function (mapId) {
                if (!$dataMap) {
                    throw new Error('The map data is not available');
                }
                this._mapId = mapId;
                this._tilesetId = $dataMap.tilesetId;
                this._displayX = 0;
                this._displayY = 0;
                this.refereshVehicles();
                this.setupEvents();
                this.setupScroll();
                this.setupParallax();
                this.setupBattleback();
                this._needsRefresh = false;

                Sentinel.mapEvents = this.events();
            };
        },

        redefineSceneMap: function () {
            Scene_Map.prototype.update = function () {
                this.updateDestination();
                this.updateMainMultiply();
                if (this.isSceneChangeOk()) {
                    this.updateScene();
                } else if (SceneManager.isNextScene(Scene_Battle)) {
                    this.updateEncounterEffect();
                }
                this.updateWaitCount();
                Scene_Base.prototype.update.call(this);

                Sentinel.update();
            };
        },

        setActive: function (gameInterpreter, args) {
            try {
                args = JSON.parse(args);
                this.active = args.active;
            } catch (e) {
                var id = gameInterpreter.eventId();
                console.error(`Sentinel's arguments are malformed (ID: ${id}): ${args}`);
            }
        },

        addSentinel: function (gameInterpreter, args) {
            var id = gameInterpreter.eventId();

            try {
                args = JSON.parse(args);
            } catch (e) {
                console.error(`Sentinel's arguments are malformed (ID: ${id}): ${args}`);
                args = [];
            }

            args = Object.assign(Sentinel.defaults, args);

            this.mapEvents.forEach(function (event) {
                if (event.eventId() == id) {
                    event._sentinel = args;
                    Sentinel.sentinels[event.eventId()] = event;
                }
            });
        },

        update: function () {
            if (this.active) {
                this.sentinels.forEach(function (event) {
                    if (event._sentinel.active && event.canSeePlayer()) {
                        console.log("te veo");
                        // TODO: activar interruptor local, global o variable. Segun config.
                    }
                });
            }
        }
    }

    Sentinel.initialize();
})();