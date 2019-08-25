//Class for saving user's progress and preferences

function mergeObjects(a, b) {
    if (b === undefined || b === null) {
        return a;
    } else if (a === undefined || a === null) {
        return b;
    }
    for (var v in b) {
        if (typeof a[v] === 'object') {
            a[v] = mergeObjects(a[v], b[v])
        } else {
            a[v] = b[v];
        }
    }
    return a;
}

function Save() {
    var prefix = 'SPNatI.';
    var endings;

    this.convertCookie = function () {
        var legacyOptionIndices = {
            autoFade: [true, false],
            cardSuggest: [true, false],
            gameDelay: [0, 400, 800, 1200, 1600],
            dealAnimation: [0, 200, 500, 1000],
            autoForfeit: [4000, 7500, 10000, null],
            autoEnding: [4000, 7500, 10000, null],
        };
        var legacyBackgroundIndices = [
            'inventory', 'beach', 'classroom', 'brick', 'night', 'roof',
            'seasonal', 'library', 'bathhouse', 'poolside', 'hot spring',
            'mansion', 'purple room', 'showers', 'street', 'green screen',
            'arcade', 'club', 'bedroom', 'hall', 'locker room',
            'haunted forest', 'romantic', 'classic'
        ];

        var data = Cookies.getJSON('save');
        if (data && typeof (data) == 'object') {
            var options = {};
            for (var key in legacyOptionIndices) {
                if (key in data) {
                    try {
                        var value = legacyOptionIndices[key][data[key] - 1];
                        options[key] = value;
                    } catch (ex) {}
                }
            }
            localStorage.setItem(prefix + 'options', JSON.stringify(options));

            var settings = {};
            if ('masturbationTimer' in data) {
                settings.stamina = data.masturbationTimer;
            }
            if (data.background) {
                settings.background = legacyBackgroundIndices[data.background - 1];
            }
            localStorage.setItem(prefix + 'settings', JSON.stringify(settings));
            if (data.gender) {
                localStorage.setItem(prefix + 'gender', data.gender);
            }
            ['male', 'female'].forEach(function (gender) {
                if (gender in data) {
                    var profile = data[gender];
                    profile.clothing = clothingChoices[gender].filter(function (item, ix) {
                        return profile.clothing[ix];
                    }).map(function (item) {
                        return item.name;
                    });
                    localStorage.setItem(prefix + gender, JSON.stringify(profile));
                }
            });
            if (typeof data.endings == 'object') {
                for (var c in data.endings) {
                    data.endings[c] = Object.keys(data.endings[c]);
                }
                localStorage.setItem(prefix + 'endings', JSON.stringify(data.endings));
            }
            if (data.askedUsageTracking) {
                localStorage.setItem(prefix + 'usageTracking', data.usageTracking ? 'yes' : 'no');
            }
            Cookies.remove('save');
        }
    };

    this.load = function () {
        this.convertCookie();
        this.loadOptions();
        this.loadPlayer();
    };

    var defaultWardrobes = {
        'male': ['jacket', 't-shirt', 'belt', 'pants', 'boxers', 'gloves', 'socks', 'boots'],
        'female': ['jacket', 'tank top', 'bra', 'belt', 'pants', 'panties', 'stockings', 'shoes'],
    };
    this.loadPlayer = function () {
        var gender = humanPlayer.gender;
        var profile = {};
        try {
            profile = JSON.parse(localStorage.getItem(prefix + gender)) || {};
        } catch (ex) {
            console.error('Failed parsing', gender, 'player profile from localStorage');
        }
        $nameField.val(profile.name || '');
        changePlayerSize(profile.size || eSize.MEDIUM);
        selectedChoices = clothingChoices[gender].map(function (item) {
            return (profile.clothing || defaultWardrobes[gender]).indexOf(item.name) >= 0;
        });
        playerTagSelections = profile.tags || {};
    };
    this.savePlayer = function () {
        localStorage.setItem(prefix + 'gender', humanPlayer.gender);
        /*  var tags = {};
            for (var key in playerTagSelections) {
                tags[key] = playerTagSelections[key];
            }*/
        var profile = {
            name: $nameField.val(),
            size: humanPlayer.size,
            tags: playerTagSelections,
            clothing: clothingChoices[humanPlayer.gender].filter(function (item, ix) {
                return selectedChoices[ix];
            }).map(function (item) {
                return item.name;
            }),
        };
        localStorage.setItem(prefix + humanPlayer.gender, JSON.stringify(profile));
    };
    this.loadOptions = function () {
        try {
            var options = JSON.parse(localStorage.getItem(prefix + 'options')) || {};
            if ('autoFade' in options && typeof options.autoFade == 'boolean') AUTO_FADE = options.autoFade;
            if ('cardSuggest' in options && typeof options.cardSuggest == 'boolean') CARD_SUGGEST = options.cardSuggest;
            if ('explainHands' in options && typeof options.explainHands == 'boolean') EXPLAIN_ALL_HANDS = options.explainHands;
            if ('gameDelay' in options && typeof options.gameDelay == 'number') GAME_DELAY = options.gameDelay;
            if ('dealAnimation' in options && typeof options.dealAnimation == 'number') {
                ANIM_TIME = options.dealAnimation;
                ANIM_DELAY = 0.16 * ANIM_TIME;
            }
            if ('autoForfeit' in options &&
                (typeof options.autoForfeit == 'number' || options.autoForfeit === null))
                FORFEIT_DELAY = options.autoForfeit;
            if ('autoEnding' in options &&
                (typeof options.autoEnding == 'number' || options.autoEnding === null))
                ENDING_DELAY = options.autoEnding;
            if ('minimalUI' in options && typeof options.minimalUI == 'boolean') setUIMode(options.minimalUI);
            if ('playerFinishingEffect' in options && typeof options.playerFinishingEffect == 'boolean') PLAYER_FINISHING_EFFECT = options.cardSuggest;
        } catch (ex) {
            console.error('Failed parsing options from localStorage');
        }
        try {
            var settings = JSON.parse(localStorage.getItem(prefix + 'settings')) || {};
            if ('stamina' in settings) humanPlayer.stamina = settings.stamina;

            this.loadOptionsBackground(settings);

            if ('useGroupBackgrounds' in settings) {
                useGroupBackgrounds = !!settings.useGroupBackgrounds;
            } else {
                useGroupBackgrounds = true;
            }
        } catch (ex) {
            console.error('Failed parsing settings from localStorage');
        }
        var usageTracking = localStorage.getItem(prefix + 'usageTracking');
        if (usageTracking) {
            USAGE_TRACKING = (usageTracking == 'yes');
        }
        var gender = localStorage.getItem(prefix + 'gender');
        if (gender) {
            humanPlayer.gender = gender;
        }
    };
    this.loadOptionsBackground = function (settings) {
        if (!settings) {
            settings = JSON.parse(localStorage.getItem(prefix + 'settings')) || {};
        }

        optionsBackground = defaultBackground;

        if ('background' in settings) {
            var bg_id = settings.background;
            if (backgrounds[bg_id]) {
                optionsBackground = backgrounds[bg_id];
            }
        };

        return optionsBackground.activateBackground();
    }
    this.saveUsageTracking = function () {
        if (USAGE_TRACKING !== undefined) {
            localStorage.setItem(prefix + 'usageTracking', USAGE_TRACKING ? 'yes' : 'no');
        }
    };
    this.saveOptions = function () {
        var options = {
            autoFade: AUTO_FADE,
            cardSuggest: CARD_SUGGEST,
            explainHands: EXPLAIN_ALL_HANDS,
            gameDelay: GAME_DELAY,
            dealAnimation: ANIM_TIME,
            autoForfeit: FORFEIT_DELAY,
            autoEnding: ENDING_DELAY,
            minimalUI: MINIMAL_UI,
            playerFinishingEffect: PLAYER_FINISHING_EFFECT,
        };
        localStorage.setItem(prefix + 'options', JSON.stringify(options));
    };
    this.saveSettings = function () {
        var settings = {
            stamina: humanPlayer.stamina,
            useGroupBackgrounds: useGroupBackgrounds
        };

        if (optionsBackground && optionsBackground.id !== defaultBackground.id) {
            settings.background = optionsBackground.id;
        } else {
            delete settings.background;
        }
        localStorage.setItem(prefix + 'settings', JSON.stringify(settings));
    };
    this.loadEndings = function () {
        if (endings === undefined) {
            try {
                endings = JSON.parse(localStorage.getItem(prefix + 'endings')) || {};
            } catch (e) {
                console.error('Failed parsing endings from localStorage');
                endings = {};
            }
        }
    };
    this.hasEnding = function (character, title) {
        this.loadEndings();
        if (character in endings && Array.isArray(endings[character])) {
            return endings[character].indexOf(title) >= 0;
        }
        return false;
    };
    this.addEnding = function (character, title) {
        this.loadEndings();
        if (!(character in endings)) {
            endings[character] = [];
        } else if (endings[character].indexOf(title) >= 0) {
            return
        }
        endings[character].push(title);
        localStorage.setItem(prefix + 'endings', JSON.stringify(endings));
        //Clear table of endings, so they are loaded agin when player visits gallery
        allEndings = [];
        anyEndings = [];
        maleEndings = [];
        femaleEndings = [];
    }

    this.setCollectibleCounter = function (collectible, counter) {
        if (!COLLECTIBLES_ENABLED) return;

        var charID = '__general';
        if (collectible.player) {
            charID = collectible.player.id;
        }

        localStorage.setItem(prefix + 'collectibles.' + charID + collectible.id, counter.toString());
    }

    this.getCollectibleCounter = function (collectible) {
        if (!COLLECTIBLES_ENABLED) return 0;

        var charID = '__general';
        if (collectible.player) {
            charID = collectible.player.id;
        }

        var ctr = localStorage.getItem(prefix + 'collectibles.' + charID + collectible.id);

        return parseInt(ctr, 10) || 0;
    }

    this.getPersistentMarker = function (player, name) {
        var val = localStorage.getItem(prefix + 'markers.' + player.id + '.' + name);
        return val || '';
    }

    this.setPersistentMarker = function (player, name, value) {
        localStorage.setItem(prefix + 'markers.' + player.id + '.' + name, value.toString());
    }

    this.setOpponentCached = function (oppId, status) {
        localStorage.setItem(prefix + "cache." + oppId, status.toString());
    }

    this.isOpponentCached = function (oppId) {
        val = localStorage.getItem(prefix + "cache." + oppId);
        return val === 'true';
    }

    /** Serializes the localStorage into a base64-encoded JSON string */
    this.serializeLocalStorage = function () {
        return Base64.encode(JSON.stringify(localStorage));
    }

    /** Loads a base64-encoded JSON string into the localStorage */
    this.deserializeLocalStorage = function (code) {
        try {
            var json = Base64.decode(code);
            console.log(json);
            var data = JSON.parse(json);
        } catch (e) {
            if (e instanceof SyntaxError) {
                /* JSON parse error */
                return false;
            } else {
                /* re-raise everything else */
                throw e;
            }
        }

        localStorage.clear();
        for (var key in data) {
            localStorage.setItem(key, data[key]);
        }
        save.load();

        return true;
    }
}

var save = new Save();

function saveSettings() {
    save.saveSettings();
};

function saveOptions() {
    save.saveOptions();
}

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/
var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}