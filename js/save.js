//Class for saving user's progress and preferences

var DEFAULT_WARDROBES = {
    'male': [ 'jacket', 't-shirt', 'belt', 'pants', 'boxers', 'gloves', 'socks', 'boots' ],
    'female': [ 'jacket', 'tank top', 'bra', 'belt', 'pants', 'panties', 'stockings', 'shoes' ],
};

var LEGACY_OPTION_INDICES = {
    autoFade: [ true, false ],
    cardSuggest: [ true, false ],
    gameDelay: [ 0, 400, 800, 1200, 1600 ],
    dealAnimation: [ 0, 200, 500, 1000 ],
    autoForfeit: [ 4000, 7500, 10000, null ],
    autoEnding: [ 4000, 7500, 10000, null ],
};

var LEGACY_BG_INDICES = [
    'inventory', 'beach', 'classroom', 'brick', 'night', 'roof',
    'seasonal', 'library', 'bathhouse', 'poolside', 'hot spring',
    'mansion', 'purple room', 'showers', 'street', 'green screen',
    'arcade', 'club', 'bedroom', 'hall', 'locker room',
    'haunted forest', 'romantic', 'classic'
];

function Save() {
    this.prefix = 'SPNatI.';

    /**
     * Intermediate storage for values.
     * Serves as a fallback in case writing to localStorage fails.
     * 
     * @type {Object<string, any>}
     */
    this.storageCache = {};

    /**
     * A map containing what endings have been unlocked by this player
     * for each character.
     * 
     * @type {Object<string, string[]>}
     */
    this.endings = {};

    /* Load data from LocalStorage. */
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key.startsWith(this.prefix)) {
                continue;
            }

            var suffix = key.substring(this.prefix.length);
            this.storageCache[suffix] = localStorage.getItem(key);
        }
    } catch (ex) {
        console.error("Failed to load save data from localStorage: ", ex);
        /* Don't send error data to Sentry, because SENTRY_INITIALIZED
         * may not be defined when this is called
         */
    }
}

/**
 * Get an object from save storage.
 * 
 * @param {string} key The key to use for this value, not including the prefix.
 * @param {boolean} [acceptBareString] If true, serialized values that fail to
 * parse will be interpreted as bare string values (output by previous versions)
 * @returns {any}
 */
Save.prototype.getItem = function (key, acceptBareString) {
    var serialized = this.storageCache[key];

    if (typeof(serialized) !== "string") {
        return;
    }

    try {
        return JSON.parse(serialized);
    } catch (ex) {
        if (acceptBareString) {
            this.setItem(key, serialized); // Convert the string into a properly serialized JSON value.
            return serialized;
        } else {
            console.error("Failed to parse saved data for '"+key+"': ", ex);
            if (SENTRY_INITIALIZED) Sentry.captureException(ex);
        }
    }
}

/**
 * Put an object into save storage.
 * 
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
Save.prototype.setItem = function (key, value) {
    /* Serialize before putting into storage cache.
     *
     * The main reason is to head off any subtle issues with reference sharing
     * that would come about as a result of storing values directly within
     * the cache. I could just be paranoid, though.
     */
    var serialized = '';
    try {
        serialized = JSON.stringify(value);
    } catch (ex) {
        console.error("Failed to serialize saved data for '"+key+"': ", ex);
        if (SENTRY_INITIALIZED) Sentry.captureException(ex);
        return;
    }

    this.storageCache[key] = serialized;

    try {
        localStorage.setItem(this.prefix + key, serialized);
    } catch (ex) {
        console.error("Failed to save data '"+key+"' to localStorage: ", ex);
        if (SENTRY_INITIALIZED) Sentry.captureException(ex);
    }
}

/**
 * Delete a key from save storage.
 * 
 * @param {string} key
 * @returns {void}
 */
Save.prototype.removeItem = function (key) {
    delete this.storageCache[key];

    try {
        localStorage.removeItem(this.prefix + key);
    } catch (ex) {
        console.error("Failed to remove data '"+key+"' from localStorage: ", ex);
        if (SENTRY_INITIALIZED) Sentry.captureException(ex);
    }
}

/** Serializes the save storage into a base64-encoded JSON string */
Save.prototype.serializeStorage = function () {
    return Base64.encode(JSON.stringify(this.storageCache));
}

/** Loads output from serializeStorage into the save storage */
Save.prototype.deserializeStorage = function (code) {
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

    /* Load data into storage cache first: */
    this.storageCache = {};
    for (var key in data) {
        if (key.startsWith(this.prefix)) {
            var suffix = key.substring(this.prefix.length);
            this.storageCache[suffix] = data[key];
        } else {
            this.storageCache[key] = data[key];
        }
    }

    /* Then try to load data into localStorage: */
    try {
        localStorage.clear();
        Object.keys(this.storageCache).forEach(function (key) {
            localStorage.setItem(this.prefix + key, this.storageCache[key]);
        }.bind(this));
    } catch (ex) {
        console.error('Failed to write save code data to localStorage: ', ex);
        if (SENTRY_INITIALIZED) Sentry.captureException(ex);
    }

    this.load();
    return true;
}

Save.prototype.convertCookie = function() {
    var data = Cookies.getJSON('save');
    if (data && typeof(data) == 'object') {
        var options = {};
        for (var key in LEGACY_OPTION_INDICES) {
            if (key in data) {
                try {
                    var value = LEGACY_OPTION_INDICES[key][data[key] - 1];
                    options[key] = value;
                } catch (ex) { }
            }
        }
        this.setItem("options", options);

        var settings = {};
        if ('masturbationTimer' in data) {
            settings.stamina = data.masturbationTimer;
        }
        if (data.background) {
            settings.background = LEGACY_BG_INDICES[data.background - 1];
        }
        this.setItem("settings", settings);

        if (data.gender) {
            this.setItem("gender", data.gender);
        }

        ['male', 'female'].forEach(function(gender) {
            if (gender in data) {
                var profile = data[gender];

                profile.clothing = clothingChoices[gender].filter(function(item, ix) {
                    return profile.clothing[ix];
                }).map(function(item) { return item.name; });

                this.setItem(gender, profile);
            }
        });

        if (typeof data.endings == 'object') {
            for (var c in data.endings) {
                data.endings[c] = Object.keys(data.endings[c]);
            }
            this.setItem("endings", data.endings);
        }

        if (data.askedUsageTracking) {
            this.setItem("usageTracking", data.usageTracking);
        }

        Cookies.remove('save');
    }
};

Save.prototype.load = function() {
    this.convertCookie();
    this.loadOptions();
    this.loadPlayer();
    this.loadEndings();
    ACTIVE_CARD_IMAGES.load();
};

Save.prototype.loadPlayer = function() {
    var gender = humanPlayer.gender;
    var profile = this.getItem(gender) || {};

    $nameField.val(profile.name || '');
    changePlayerSize(profile.size || eSize.MEDIUM);
    selectedChoices = clothingChoices[gender].map(function(item) {
        return (profile.clothing || DEFAULT_WARDROBES[gender]).indexOf(item.name) >= 0;
    });
    playerTagSelections = profile.tags || {};
};

Save.prototype.savePlayer = function() {
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

    this.setItem("gender", humanPlayer.gender);
    this.setItem(humanPlayer.gender, profile);
};

Save.prototype.loadOptions = function(){
    var options = this.getItem("options")|| {};

    if ('autoFade' in options && typeof options.autoFade == 'boolean') AUTO_FADE = options.autoFade;
    if ('cardSuggest' in options && typeof options.cardSuggest == 'boolean') CARD_SUGGEST = options.cardSuggest;
    if ('explainHands' in options && typeof options.explainHands == 'boolean') EXPLAIN_ALL_HANDS = options.explainHands;
    if ('gameDelay' in options && typeof options.gameDelay == 'number') GAME_DELAY = options.gameDelay;
    if ('dealAnimation' in options && typeof options.dealAnimation == 'number') {
        ANIM_TIME = options.dealAnimation;
        ANIM_DELAY = 0.16 * ANIM_TIME;
    }
    if ('autoForfeit' in options
        && (typeof options.autoForfeit == 'number' || options.autoForfeit === null))
        FORFEIT_DELAY = options.autoForfeit;
    if ('autoEnding' in options
        && (typeof options.autoEnding == 'number' || options.autoEnding === null))
        ENDING_DELAY = options.autoEnding;
    if ('minimalUI' in options && typeof options.minimalUI == 'boolean') setUIMode(options.minimalUI);
    if ('playerFinishingEffect' in options && typeof options.playerFinishingEffect == 'boolean') PLAYER_FINISHING_EFFECT = options.playerFinishingEffect;

    var settings = this.getItem("settings") || {};
    if ('stamina' in settings) humanPlayer.stamina = settings.stamina;

    this.loadOptionsBackground(settings);

    if ('useGroupBackgrounds' in settings) {
        useGroupBackgrounds = !!settings.useGroupBackgrounds;
    } else {
        useGroupBackgrounds = true;
    }

    var usageTracking = this.getItem("usageTracking", true);
    if (typeof(usageTracking) === 'boolean') {
        USAGE_TRACKING = usageTracking;
    } else if (typeof(usageTracking) === 'string') {
        USAGE_TRACKING = (usageTracking == 'yes');
        this.setItem("usageTracking", USAGE_TRACKING); // Convert old value to a proper boolean.
    } else {
        USAGE_TRACKING = undefined;
    }

    var gender = this.getItem("gender", true);
    if (gender) {
        humanPlayer.gender = gender;
    }
};

Save.prototype.loadOptionsBackground = function (settings) {
    if (!settings) {
        settings = this.getItem("settings") || {};
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

Save.prototype.saveUsageTracking = function() {
    if (USAGE_TRACKING !== undefined) {
        this.setItem("usageTracking", USAGE_TRACKING);
    }
};

Save.prototype.saveOptions = function() {
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
    
    this.setItem("options", options);
};

Save.prototype.saveSettings = function() {
    var settings = {
        stamina: humanPlayer.stamina,
        useGroupBackgrounds: useGroupBackgrounds
    };

    if (optionsBackground && optionsBackground.id !== defaultBackground.id) {
        settings.background = optionsBackground.id;
    } else {
        delete settings.background;
    }

    this.setItem("settings", settings);
};

Save.prototype.loadEndings = function () {
    this.endings = this.getItem("endings") || {};
}

/**
 * Get whether an epilogue has been unlocked by the player.
 * 
 * @param {string} character
 * @param {string} title
 */
Save.prototype.hasEnding = function(character, title) {
    this.loadEndings();

    var endingsArray = this.endings[character];
    if (Array.isArray(endingsArray)) {
        return endingsArray.indexOf(title) >= 0;
    }

    return false;
};

/**
 * Mark an epilogue as being unlocked in the Gallery.
 * 
 * @param {string} character
 * @param {string} title
 */
Save.prototype.addEnding = function(character, title) {
    this.loadEndings();

    if (!(character in this.endings)) {
        this.endings[character] = [];
    } else if (this.endings[character].indexOf(title) >= 0) {
        return;
    }

    this.endings[character].push(title);
    this.setItem("endings", this.endings);
    
    //Clear table of endings, so they are loaded agin when player visits gallery
    allEndings = [];
    anyEndings = [];
    maleEndings = [];
    femaleEndings = [];
}

/**
 * Set the stored counter value for a Collectible.
 * 
 * @param {Collectible} collectible
 * @param {number} counter
 */
Save.prototype.setCollectibleCounter = function (collectible, counter) {
    if (!COLLECTIBLES_ENABLED) return;
    
    var charID = '__general';
    if (collectible.player) {
        charID = collectible.player.id;
    }

    var key = 'collectibles.' + charID + '.' + collectible.id;
    this.setItem(key, counter);
}

/**
 * Get the stored counter value for a Collectible.
 * 
 * @param {Collectible} collectible
 * @returns {number}
 */
Save.prototype.getCollectibleCounter = function (collectible) {
    if (!COLLECTIBLES_ENABLED) return 0;
    
    var charID = '__general';
    if (collectible.player) {
        charID = collectible.player.id;
    }

    /* Need to correct for incorrectly generated key names from previous
     * versions.
     */
    var newKey = 'collectibles.' + charID + '.' + collectible.id;
    var ctr = this.getItem(newKey);
    if (typeof(ctr) === "number") {
        return ctr;
    } else {
        var oldKey = 'collectibles.' + charID + collectible.id;
        ctr = parseInt(this.getItem(oldKey), 10);
        if (isNaN(ctr)) {
            /* No values available at all */
            return 0;
        }

        /* Save to the correct key and clear out the previous key */
        this.setItem(newKey, ctr);
        this.removeItem(oldKey);

        return ctr;
    }
}

/**
 * Get the value of a persistent marker stored for a player.
 * 
 * @param {Player} player
 * @param {string} name
 * @returns {string | number}
 */
Save.prototype.getPersistentMarker = function (player, name) {
    var val = this.getItem('marker.' + player.id + '.' + name, true);
    return val || '';
}

/**
 * Set the value of a persistent marker stored for a player.
 * 
 * @param {Player} player
 * @param {string} name
 * @param {string | number} value
 */
Save.prototype.setPersistentMarker = function (player, name, value) {
    this.setItem('marker.' + player.id + '.' + name, value);
}

/**
 * Gets the set of played characters for resort modal tracking.
 * @returns {string[]}
 */
Save.prototype.getPlayedCharacterSet = function () {
    var s = this.getItem("playedCharacters");
    if (!Array.isArray(s)) {
        return [];
    } else {
        return s;
    }
}

/**
 * Save the set of played characters for resort modal tracking.
 * @param {string[]} set
 */
Save.prototype.savePlayedCharacterSet = function (set) {
    /* Get unique characters in set. */
    var o = {};
    set.forEach(function (v) {
        if (loadedOpponents.some(function (pl) { return !pl.status && pl.id === v })) {
            o[v] = true;
        }
    });

    this.setItem("playedCharacters", Object.keys(o));
}

Save.prototype.hasShownResortModal = function () {
    return !!this.getItem("resortModalShown");
}

Save.prototype.setResortModalFlag = function (val) {
    this.setItem("resortModalShown", !!val);
}

var save = new Save();

function saveSettings(){
    save.saveSettings();
};

function saveOptions(){
    save.saveOptions();
    save.saveSettings();
}

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {

// private property
_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
encode : function (input) {
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
decode : function (input) {
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
_utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }

    }

    return utftext;
},

// private method for UTF-8 decoding
_utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
}

}
