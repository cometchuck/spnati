if (!monika) var monika = (function (root) {

    /* Polyfill String.prototype.repeat */
    if (!String.prototype.repeat) {
        String.prototype.repeat = function (count) {
            'use strict';
            if (this == null)
                throw new TypeError('can\'t convert ' + this + ' to object');

            var str = '' + this;
            // To convert string to integer.
            count = +count;
            // Check NaN
            if (count != count)
                count = 0;

            if (count < 0)
                throw new RangeError('repeat count must be non-negative');

            if (count == Infinity)
                throw new RangeError('repeat count must be less than infinity');

            count = Math.floor(count);
            if (str.length == 0 || count == 0)
                return '';

            // Ensuring count is a 31-bit integer allows us to heavily optimize the
            // main part. But anyway, most current (August 2014) browsers can't handle
            // strings 1 << 28 chars or longer, so:
            if (str.length * count >= 1 << 28)
                throw new RangeError('repeat count must not overflow maximum string size');

            var maxCount = str.length * count;
            count = Math.floor(Math.log(count) / Math.log(2));
            while (count) {
                str += str;
                count--;
            }
            str += str.substring(0, maxCount - str.length);
            return str;
        }
    }

    var exports = {};

    if (root.SENTRY_INITIALIZED) {
        root.Sentry.setTag('monika-loaded', true);
        root.Sentry.addBreadcrumb({
            category: 'monika',
            message: 'Initializing monika.js...',
            level: 'info'
        });
    }

    exports.EFFECTS_ENABLED = true;
    exports.GLITCH_MODIFIER = 1.0;

    exports.ACTIVE_FORFEIT_EFFECT = null;
    exports.JOINT_FORFEIT_ACTIVE = false;
    exports.SAYORI_AFFECTIONS_GLITCH = false;

    function loadScript(scriptName) {
        console.log("[Monika] Loading module: " + scriptName);

        const script = document.createElement('script');
        script.src = scriptName;
        script.async = false;

        script.addEventListener('load', function () {
            console.log("[Monika] Loaded module: " + scriptName);
        });

        script.addEventListener('error', function () {
            console.error("[Monika] Error loading " + scriptName);
        });

        root.document.head.appendChild(script);

        if ('serviceWorker' in navigator && navigator.onLine) {
            caches.open(root.DYNAMIC_CACHE_NAME).then(function (cache) {
                cache.add(scriptName);
            });
        }
    }

    /* Load in other resources and scripts: */
    $('head').append('<link rel="stylesheet" type="text/css" href="opponents/monika/css/monika.css">');

    loadScript('opponents/monika/js/utils.js');
    loadScript('opponents/monika/js/effects.js');
    loadScript('opponents/monika/js/extended_dialogue.js');
    loadScript('opponents/monika/js/behaviour_callbacks.js');


    /* Add Options Modal settings: */
    var glitchOptionsContainer = $('<tr><td style="width:25%"><h4 class="modal-title modal-left">Monika Glitches</h4></td></tr>');
    glitchOptionsContainer.append('<td><nav><ul class="pagination" id="monika-glitch-options-list"></ul></nav>')

    $("#options-modal table").append(glitchOptionsContainer);

    var glitchOptionsList = $("#monika-glitch-options-list");
    glitchOptionsList.append('<li id="options-monika-glitches-3"><a href="#" onclick="monika.configureGlitchChance(3)">Off</a></li>')
    glitchOptionsList.append('<li id="options-monika-glitches-2"><a href="#" onclick="monika.configureGlitchChance(2)">Low</a></li>')
    glitchOptionsList.append('<li id="options-monika-glitches-1" class="active"><a href="#" onclick="monika.configureGlitchChance(1)">Normal</a></li>')

    function configureGlitchChance(mode) {
        console.log("[Monika] Glitches configured to mode " + mode);

        $("#options-monika-glitches-1").removeClass("active");
        $("#options-monika-glitches-2").removeClass("active");
        $("#options-monika-glitches-3").removeClass("active");

        if (root.SENTRY_INITIALIZED) root.Sentry.setTag('monika-glitch-mode', mode);

        switch (mode) {
            /* Off */
            case 3:
                $("#options-monika-glitches-3").addClass("active");
                exports.EFFECTS_ENABLED = false;
                exports.GLITCH_MODIFIER = 0;
                break;

                /* Low */
            case 2:
                $("#options-monika-glitches-2").addClass("active");
                exports.EFFECTS_ENABLED = true;
                exports.GLITCH_MODIFIER = 0.5;
                break;

                /* Normal */
            case 1:
            default:
                $("#options-monika-glitches-1").addClass("active");
                exports.EFFECTS_ENABLED = true;
                exports.GLITCH_MODIFIER = 1.0;
                break;
        }
    }
    exports.configureGlitchChance = configureGlitchChance;
    configureGlitchChance(1);

    function reportException(prefix, e) {
        console.log("[Monika] Exception swallowed " + prefix + ": ");
        console.error(e);

        try {
            if (e) {
                jsErrors.push({
                    'date': (new Date()).toISOString(),
                    'type': e.name,
                    'message': e.message,
                    'filename': e.filename,
                    'lineno': e.lineNumber,
                    'stack': e.stack
                });
            }
        } catch (e2) {
            console.error(e2);
        }

        if (USAGE_TRACKING) {
            if (SENTRY_INITIALIZED) {
                Sentry.withScope(function (scope) {
                    scope.setTag("monika-error", true);
                    scope.setExtra("where", prefix);
                    Sentry.captureException(e);
                });
            }

            var report = compileBaseErrorReport('Exception caught from Monika code.', 'auto');

            $.ajax({
                url: BUG_REPORTING_ENDPOINT,
                method: 'POST',
                data: JSON.stringify(report),
                contentType: 'application/json',
                error: function (jqXHR, status, err) {
                    console.error("Could not send bug report - error " + status + ": " + err);
                },
            });
        }
    }
    exports.reportException = reportException;

    function registerBehaviourCallback(name, func) {
        exports[name] = function () {
            try {
                return func.apply(null, arguments);
            } catch (e) {
                reportException('in behaviour callback ' + name, e);
            }
        };
    }

    exports.registerBehaviourCallback = registerBehaviourCallback;

    /* Set up hooks system... */
    var registeredHooks = {};
    exports.hooks = registeredHooks;

    function registerHook(hookedID, hookType, hookFunc) {
        registeredHooks[hookedID][hookType].push(hookFunc);
        return hookFunc;
    }
    exports.registerHook = registerHook;

    function unregisterHook(hookedID, hookType, hookFunc) {
        var hookList = registeredHooks[hookedID][hookType];
        var idx = hookList.indexOf(hookFunc);
        if (idx < 0) return;

        hookList.splice(idx, 1);
    }
    exports.unregisterHook = unregisterHook;

    function hookWrapper(func_id) {
        registeredHooks[func_id] = {
            'pre': [],
            'post': []
        };

        var original_function = root[func_id];
        return function () {
            if (!players.some(function (p) {
                    return p.id === 'monika';
                })) {
                return original_function.apply(null, arguments);
            }

            /* Prevent the original function from firing if any pre-hook
             * returns true.
             */
            var wrapper_args = arguments;
            try {
                if (registeredHooks[func_id].pre.some(function (hook) {
                        return hook.apply(null, wrapper_args);
                    })) {
                    return;
                };
            } catch (e) {
                reportException("in pre-" + func_id + " hooks", e);
            }

            var retval = original_function.apply(null, arguments);

            try {
                registeredHooks[func_id].post.forEach(function (hook) {
                    hook.apply(null, wrapper_args);
                });
            } catch (e) {
                reportException("in post-" + func_id + " hooks", e);
            } finally {
                return retval;
            }
        }
    }

    root.showOptionsModal = hookWrapper('showOptionsModal');
    root.advanceGame = hookWrapper('advanceGame');
    root.advanceTurn = hookWrapper('advanceTurn');
    root.startDealPhase = hookWrapper('startDealPhase');
    root.completeContinuePhase = hookWrapper('completeContinuePhase');
    root.completeMasturbatePhase = hookWrapper('completeMasturbatePhase');
    root.completeStripPhase = hookWrapper('completeStripPhase');
    root.completeRevealPhase = hookWrapper('completeRevealPhase');
    root.updateGameVisual = hookWrapper('updateGameVisual');
    root.advanceSelectScreen = hookWrapper('advanceSelectScreen');
    root.restartGame = hookWrapper('restartGame');
    root.exitRollback = hookWrapper('exitRollback');

    function handleOptionsModal() {
        if (utils.monika_present()) {
            glitchOptionsContainer.show();
        } else {
            glitchOptionsContainer.hide();
        }
    }
    registerHook('showOptionsModal', 'pre', handleOptionsModal);

    /* Primary glitch control logic. */
    var active_effects = [];
    exports.active_effects = active_effects;

    var active_deletion_glitch = null;
    var active_repeat_visuals_glitch = null;
    var round_glitch_targets = [];

    function cleanupAllEffects() {
        /* Copy the active_effects list before iterating over it */
        var active_copy = active_effects.slice();

        active_copy.forEach(function (eff) {
            try {
                eff.revert();
            } catch (e) {
                reportException("while cleaning up " + eff.constructor.name, e);
            }
        });
    }
    registerHook('restartGame', 'post', cleanupAllEffects);

    function getCurrentGlitchChance() {
        /* Situation Score calculation:
         * - fully clothed opponents: +0
         * - partially-undressed opponents (no exposure): +1
         * - one position exposed: +2
         * - both positions exposed: +3
         * - forfeiting / finished: +5
         */

        var situationScore = 0;
        var totalPlayers = 0;
        for (var i = 0; i < players.length; i++) {
            if (!players[i]) continue;
            totalPlayers += 1;

            var pl = players[i];
            if (pl.out) {
                situationScore += 5;
            } else if (pl.exposed.upper && pl.exposed.lower) {
                situationScore += 3;
            } else if (pl.exposed.upper || pl.exposed.lower) {
                situationScore += 2;
            } else if (pl.clothing.length !== pl.startingLayers) {
                situationScore += 1;
            }
        }

        var glitchChance = Math.min(0.10, situationScore / 100);
        return glitchChance * exports.GLITCH_MODIFIER;
    }


    function setGlitchMarkers(targetedSlot, glitch_type, value) {
        var monika_player = monika.utils.get_monika_player();
        var target = players[targetedSlot];

        if (!target || !monika_player) {
            return;
        }

        var type_glitch_marker = 'glitch-type-' + glitch_type;
        var base_glitch_marker = 'glitching-' + target.id;
        var specific_glitch_marker = base_glitch_marker + '-' + glitch_type;

        if (value) {
            monika_player.markers[base_glitch_marker] = 1;
            monika_player.markers[specific_glitch_marker] = 1;
            monika_player.markers[type_glitch_marker] = 1;
            monika_player.markers['glitched'] = 1;
        } else {
            monika_player.markers[base_glitch_marker] = 0;
            monika_player.markers[specific_glitch_marker] = 0;
            monika_player.markers[type_glitch_marker] = 0;
        }
    }

    function clearDeleteGlitch() {
        if (active_deletion_glitch) {
            setGlitchMarkers(active_deletion_glitch.target_slot, 'delete', false);
            active_deletion_glitch.revert();
            active_deletion_glitch = null;
        }
    }
    registerHook('completeContinuePhase', 'pre', clearDeleteGlitch);
    registerHook('completeMasturbatePhase', 'pre', clearDeleteGlitch);
    registerHook('completeStripPhase', 'pre', clearDeleteGlitch);

    function clearRepeatVisualsGlitch() {
        if (active_repeat_visuals_glitch) {
            setGlitchMarkers(active_repeat_visuals_glitch.target_slot, 'visual', false);
            active_repeat_visuals_glitch.revert();
            active_repeat_visuals_glitch = null;
        }
    }
    registerHook('completeRevealPhase', 'pre', clearRepeatVisualsGlitch);

    function resetAllEffects() {
        clearDeleteGlitch();
        clearRepeatVisualsGlitch();

        if (exports.ACTIVE_FORFEIT_EFFECT) {
            exports.ACTIVE_FORFEIT_EFFECT.revert();
            exports.ACTIVE_FORFEIT_EFFECT = null;
        }
    }
    registerHook('advanceSelectScreen', 'pre', resetAllEffects);

    function setupRoundGlitches() {
        /* don't do anything if effects are disabled */
        if (!exports.EFFECTS_ENABLED) return;

        console.log("[Monika] Round starting...");
        console.log("[Monika] Current glitch chance: " + getCurrentGlitchChance());
        round_glitch_targets = [];

        clearDeleteGlitch();
        clearRepeatVisualsGlitch();

        if (Math.random() < getCurrentGlitchChance()) {
            /* Determine deletion glitch targets first, since that overrides everything */
            var deleteTarget = utils.pick_glitch_target();
            if (deleteTarget) {
                active_deletion_glitch = new monika_effects.FakeDeleteCharacter(deleteTarget);
                setGlitchMarkers(deleteTarget, 'delete', true);
                round_glitch_targets.push(deleteTarget);
            }
        }

        if (Math.random() < getCurrentGlitchChance()) {
            /* Now determine continuous glitch targets: */
            var visualTarget = utils.pick_glitch_target(round_glitch_targets);
            if (visualTarget) {
                active_repeat_visuals_glitch = new monika_effects.RepeatingVisualGlitchEffect(visualTarget, 1000, 1000);
                setGlitchMarkers(deleteTarget, 'visual', true);
                round_glitch_targets.push(visualTarget);

                active_repeat_visuals_glitch.execute();
            }
        }
    }
    registerHook('startDealPhase', 'pre', setupRoundGlitches);

    /* Set up transient glitches.
     * These are one-shot effects that happen on a per-phase basis.
     */
    function setupTransientGlitches(player) {
        if (!inGame || round_glitch_targets.indexOf(player) >= 0 || !exports.EFFECTS_ENABLED) return;

        if (!players[player] || players[player].id === 'monika') return;
        if (Math.random() >= getCurrentGlitchChance()) return;

        var glitchType = getRandomNumber(0, 3);

        if (glitchType === 0) {
            /* Visual glitch */
            console.log("[Monika] Executing transient visual glitch for slot " + player);
            var visEffect = new monika_effects.VisualGlitchEffect(player);
            visEffect.execute(function () {
                setTimeout(function () {
                    visEffect.revert();
                }, 1000);
            });
        } else if (glitchType === 1) {
            /* Dialogue content glitch */
            if (Math.random() < 0.5) {
                console.log("[Monika] Executing transient zalgo text glitch for slot " + player);
                var dialogueEffect = new monika_effects.DialogueZalgoText(player);
            } else {
                console.log("[Monika] Executing transient text corruption glitch for slot " + player);
                var dialogueEffect = new monika_effects.DialogueCharacterReplacement(player, 0.1);
            }

            dialogueEffect.execute(function () {
                setTimeout(function () {
                    dialogueEffect.revert();
                }, 1000);
            });
        } else if (glitchType === 2) {
            /* Dialogue overflow glitch */
            console.log("[Monika] Executing transient overflow glitch for slot " + player);
            var overflowEffect = new monika_effects.DialogueOverflowEffect(player);
            overflowEffect.execute(function () {
                setTimeout(function () {
                    overflowEffect.revert();
                }, 1000);
            });
        }
    }
    registerHook('updateGameVisual', 'post', setupTransientGlitches);

    return exports;
}(this));