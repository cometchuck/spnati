/********************************************************************************
 This file contains the variables and functions that form the gallery screens of
 the game.
 ********************************************************************************/

 /**********************************************************************
  *****                   Gallery Screen UI Elements               *****
  **********************************************************************/

$galleryEndingsScreen = $('#epilogue-gallery-screen');
$galleryCollectiblesScreen = $('#collectible-gallery-screen');

/**********************************************************************
 *****          Epilogues Gallery Screen UI Elements              *****
 **********************************************************************/
 
$genderTypeButtons = [$('#gallery-gender-all'), $('#gallery-gender-any'), $('#gallery-gender-male'), $('#gallery-gender-female')];
$galleryEndings = $('#gallery-endings-block').children();
$galleryPrevButton = $('#gallery-prev-page-button');
$galleryNextButton = $('#gallery-next-page-button');
$galleryStartButton = $('#gallery-start-ending-button');
$selectedEndingPreview = $('#selected-ending-previev');
$selectedEndingLabels = [$('#selected-ending-title'), $('#selected-ending-character'), $('#selected-ending-gender')];
$selectedEndingHint = [$('#selected-ending-hint-container'), $('#selected-ending-hint')];

/**********************************************************************
 *****          Collectibles Gallery Screen UI Elements           *****
 **********************************************************************/
$collectibleListPane = $('#collectibles-list-pane');
$collectibleImagePane = $('#collectibles-image-pane');
$collectibleTextPane = $('#collectibles-text-pane');

$collectibleTextContainer = $('.collectible-text-container');

$collectibleTitle = $('#collectible-title');
$collectibleSubtitle = $('#collectible-subtitle');
$collectibleCharacter = $('#collectible-character');
$collectibleUnlock = $('#collectible-unlock');
$collectibleProgressContainer = $('#collectible-progress');
$collectibleProgressBar = $('#collectible-progress-bar');
$collectibleProgressText = $('#collectible-progress-text');
$collectibleText = $('#collectible-text');
$collectibleImage = $('#collectible-image');

function GEnding(player, ending){
    this.player = player;
    this.gender = $(ending).attr('gender');

    var previewImage = $(ending).attr('img');
    if (previewImage) {
        previewImage = previewImage.charAt(0) === '/' ? previewImage : player.base_folder + previewImage;
    } else {
        console.log("No preview image found for: "+player.id+" ending: "+$(ending).html());
    }
    
    var offlineIndicator = "";
    if ($(ending).attr('status') && $(ending).attr('status') != "online") {
        offlineIndicator = "[Offline] ";
    }

    this.image = previewImage;
    this.title = offlineIndicator + $(ending).html();
    this.unlockHint = $(ending).attr('hint');
    this.unlocked = function() { return EPILOGUES_UNLOCKED || save.hasEnding(player.id, this.title); };
}

var unescapeSubstitutions = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': '\'',
    '&amp;': '&',
}
var unescapeDialogueRE = /(&(?:lt|gt|quot|apos|amp);)/gi

function unescapeHTML(in_text) {
    if (!in_text) return '';
    
    return in_text.replace(unescapeDialogueRE, function (match, p1) {
        return unescapeSubstitutions[p1];
    });
}

function Collectible(xmlElem, player) {
    this.id = xmlElem.attr('id');
    this.image = xmlElem.attr('img');
    this.thumbnail = xmlElem.attr('thumbnail') || this.image;
    this.status = xmlElem.attr('status');
    this.title = unescapeHTML(xmlElem.children('title').text());
    this.subtitle = unescapeHTML(xmlElem.children('subtitle').text());
    this.unlock_hint = unescapeHTML(xmlElem.children('unlock').text());
    this.text = unescapeHTML(xmlElem.children('text').html());
    this.detailsHidden = xmlElem.children('hide-details').text() === 'true';
    this.hidden = xmlElem.children('hidden').text() === 'true';
    this.counter = parseInt(xmlElem.children('counter').text(), 10) || undefined;
    
    if (this.counter <= 0) this.counter = undefined;
    
    if (player) {
        this.source = player.metaLabel;
        this.player = player;
    } else {
        this.source = 'The Inventory';
        this.player = undefined;
    }
}

Collectible.prototype.isUnlocked = function () {
    if (COLLECTIBLES_UNLOCKED) return true;
    
    var curCounter = save.getCollectibleCounter(this);
    if (this.counter) {
        return curCounter >= this.counter;
    } else {
        return curCounter > 0;
    }
}

Collectible.prototype.getCounter = function () {
    var ctr = save.getCollectibleCounter(this);
    return (this.counter && ctr > this.counter) ? this.counter : ctr;
}

Collectible.prototype.unlock = function () {
    save.setCollectibleCounter(this, this.counter || 1);
}

Collectible.prototype.incrementCounter = function (inc) {
    var newCounter = save.getCollectibleCounter(this) + inc;
    
    if (this.counter && newCounter > this.counter)
        newCounter = this.counter;
    
    save.setCollectibleCounter(this, newCounter); 
}

Collectible.prototype.setCounter = function (val) {
    if (this.counter && val > this.counter)
        val = this.counter;
        
    save.setCollectibleCounter(this, val); 
}

Collectible.prototype.display = function () {
    var offlineIndicator = "";
    if (this.status && this.status != "online") {
        offlineIndicator = "[Offline] ";
    }
    
    if ((!this.detailsHidden && !this.hidden) || this.isUnlocked()) {
        $collectibleTitle.html(offlineIndicator + this.title);
        $collectibleSubtitle.html(this.subtitle).show();
    } else {
        $collectibleTitle.html(offlineIndicator + "[Locked]");
        $collectibleSubtitle.html("").hide();
    }
    
    $collectibleCharacter.text(this.source);
    $collectibleUnlock.html(this.unlock_hint);
    
    if (this.counter) {
        var curCounter = this.getCounter();
        var pct = Math.round((curCounter / this.counter) * 100);
        
        $collectibleProgressBar
            .attr('aria-valuenow', pct)
            .css('width', pct+'%');
        $collectibleProgressContainer.show();
        
        $collectibleProgressText.text('('+curCounter+' / '+this.counter+')').show();
    } else {
        $collectibleProgressContainer.hide();
        $collectibleProgressText.hide();
    }
    
    $collectibleTextPane.show();
    
    if (this.isUnlocked()) {
        $collectibleText.html(this.text);
        $collectibleTextContainer.show();
        
        if (this.image) {
            $collectibleImage.attr('src', this.image);
            $collectibleImagePane.show();
        } else {
            $collectibleImagePane.hide();
        }
    } else {
        $collectibleTextContainer.hide();
        $collectibleImagePane.hide();
    }
};

Collectible.prototype.listElement = function () {
    if (this.status && !includedOpponentStatuses[this.status]) {
        return null;
    }
    
    if (this.hidden && !this.isUnlocked()) {
        return null;
    }
    
    var baseElem = $('<div class="collectibles-list-item bordered"></div>');
    var imgElem = $('<img class="collectibles-item-icon">');
    var titleElem = $('<div class="collectibles-item-title"></div>');
    var subtitleElem = $('<div class="collectibles-item-subtitle"></div>');
    
    var offlineIndicator = "";
    if (this.status && this.status != "online") {
        offlineIndicator = "[Offline] ";
    }
    
    if (!this.detailsHidden || this.isUnlocked()) {
        titleElem.html(offlineIndicator + this.title);
        subtitleElem.html(this.subtitle);
    } else {
        titleElem.html(offlineIndicator + "[Locked]");
        subtitleElem.html(this.unlock_hint);
    }
    
    if (this.counter) {
        var curCounter = this.getCounter();
        var curSubtitle = subtitleElem.html();
        subtitleElem.html(curSubtitle + ' ('+curCounter+' / '+this.counter+')');
    }
    
    if (this.isUnlocked()) {
        imgElem.attr('src', this.thumbnail);
    } else {
        imgElem.attr('src', "img/unknown.svg");
    }
    
    baseElem.append(imgElem, titleElem, subtitleElem).click(this.display.bind(this));
    return baseElem;
};

Collectible.prototype.displayInfoModal = function () {
    $('#collectible-info-thumbnail').attr('src', this.thumbnail);
    $('#collectible-info-title').html(this.title);
    $('#collectible-info-subtitle').html(this.subtitle);
    
    $collectibleInfoModal.modal('show');
    
    /* Hide the modal if the user clicks anywhere outside of it. */
    $('.modal-backdrop').one('click', function () {
        $collectibleInfoModal.modal('hide');
    })
}


/**********************************************************************
 *****                   Gallery Screen UI Functions              *****
 **********************************************************************/
 
 
/* opponent listing file */
var galleryEndings = [];
var allEndings = [];
var galleryPage = 0;
var galleryPages = -1;
var epp = 20;
var selectedEnding = -1;
var GALLERY_GENDER = 'all';

var playerCollectibles = {}; /* Indexed by player ID. */

function goToEpiloguesScreen() {
    if (SENTRY_INITIALIZED) Sentry.setTag("screen", "gallery-epilogues");

    $galleryEndingsScreen.show();
    $galleryCollectiblesScreen.hide();
    loadGalleryEndings();
    updateGalleryScreen();
}

function goToCollectiblesScreen() {
    if (SENTRY_INITIALIZED) Sentry.setTag("screen", "gallery-collectibles");

    $galleryCollectiblesScreen.show();
    $galleryEndingsScreen.hide();
    loadAllCollectibles();
    updateCollectiblesScreen();
    $collectibleTextPane.hide();    
    $collectibleImagePane.hide();    
}

function createFilterOption (opp) {
    var elem = document.createElement('option');
    elem.value = opp.id;
    elem.text = opp.metaLabel;
    elem.className = 'gallery-character-filter-option'
    
    return elem;
}

function loadGalleryScreen(){
    screenTransition($titleScreen, $galleryScreen);
    
    /* Set up filter lists: */
    
    // Clear all previously populated list items:
    $('.gallery-character-filter-option').detach();
    
    $('#collectible-character-filter').append(loadedOpponents.filter(function (opp) {
        return opp && opp.has_collectibles;
    }).sort(function(a, b) { return a.metaLabel < b.metaLabel ? -1 : 1; }).map(createFilterOption));
    
    $('#epilogue-character-filter').append(loadedOpponents.filter(function (opp) {
        return opp && opp.endings;
    }).sort(function(a, b) { return a.metaLabel < b.metaLabel ? -1 : 1; }).map(createFilterOption));
    
    if (COLLECTIBLES_ENABLED) {
        goToCollectiblesScreen();
        if (!EPILOGUES_ENABLED) {
            $('.gallery-switch-button').hide();
        }
    } else {
        goToEpiloguesScreen();
        $('.gallery-switch-button').hide();
    }
}

function backGalleryScreen(){
    if (SENTRY_INITIALIZED) Sentry.setTag("screen", "title");
    screenTransition($galleryScreen, $titleScreen);
}

function changeCharacterFilter (collectibleScreen) {
    if (collectibleScreen) {
        updateCollectiblesScreen();
    } else {
        updateGalleryScreen();
    }
}

function loadAllCollectibles() {
    return Promise.all(loadedOpponents.map(function (opp) {
        if (opp && opp.has_collectibles) {
            return opp.loadCollectibles().then(updateCollectiblesScreen);
        } else {
            return Promise.resolve();
        }
    }));
}

function updateCollectiblesScreen() {    
    $collectibleListPane.empty();
    
    var filter = $('#collectible-character-filter').val();
    
    if (!filter || filter === '__general') {
        generalCollectibles.forEach(function (item) {
            var elem = item.listElement();
            if (elem) {
                $collectibleListPane.append(elem);    
            }
        });
    }
    
    loadedOpponents.forEach(function (opp) {
        if (!opp) return;

        if (opp.collectibles) {
            if (!opp.has_collectibles) {
                $('#collectible-character-filter [value=\"'+opp.id+'\"]').remove();
                return;
            }

            if (filter && opp.id !== filter) return;
            
            opp.collectibles.forEach(function (item) {
                var elem = item.listElement();
                if (elem) {
                    $collectibleListPane.append(elem);    
                }
            });
        }
    });
}

function loadGalleryEndings(){
    if(allEndings.length > 0){
        return;
    }
    
    for(var i=0; i<loadedOpponents.length; i++){
        if (loadedOpponents[i] && loadedOpponents[i].endings) {
            loadedOpponents[i].endings.each(function () {
                var status = $(this).attr('status');
                if (status && !includedOpponentStatuses[status]) {
                    return;
                }

                var gending = new GEnding(loadedOpponents[i], this);
                allEndings.push(gending);
            });
        }
    }
}
function updateGalleryScreen () {
    var charFilter = $('#epilogue-character-filter').val();
    
    galleryEndings = allEndings.filter(function (ending) {
        if (charFilter && ending.player.id !== charFilter) return false;
        
        switch (GALLERY_GENDER) {
        case 'male':
            if (ending.gender !== 'male') return false;
            break;
        case 'female':
            if (ending.gender !== 'female') return false;
            break;
        case 'any':
            if (ending.gender === 'male' || ending.gender === 'female') return false;
            break;
        default:
            break;
        }
        
        return true;
    });
    
    galleryPages = Math.ceil(galleryEndings.length/parseFloat(epp));
    galleryPage = 0;
    $galleryPrevButton.attr('disabled', true);
    if(galleryPages==1){
        $galleryNextButton.attr('disabled', true);
    }
    else{
        $galleryNextButton.attr('disabled', false);
    }
    loadThumbnails();
}

function loadEndingThunbnail(element, ending){
    element.removeClass('empty-thumbnail');
    if (ending.unlocked()) {
        element.removeClass('unlocked-thumbnail');
        element.css('background-image','url(\''+ending.image+'\')');
    } else {
        element.css('background-image', '');
        element.addClass('unlocked-thumbnail');
    }
}

function loadThumbnails(){
    var i=0;
    for(; i<epp && epp*galleryPage+i<galleryEndings.length; i++){
        loadEndingThunbnail($galleryEndings.eq(i), galleryEndings[epp*galleryPage+i]);
    }
    for( ; i<epp; i++){
        $galleryEndings.eq(i).removeClass('unlocked-thumbnail');
        $galleryEndings.eq(i).addClass('empty-thumbnail');
        $galleryEndings.eq(i).css('background-image', 'none');
    }
}


function galleryGender(gender){
    GALLERY_GENDER = gender;
    $('.gallery-gender-button').css('opacity', 0.4);
    switch(gender){
        case 'male':
            $('#gallery-gender-male').css('opacity', 1);
            break;
        case 'female':
            $('#gallery-gender-female').css('opacity', 1);
            break;
        case 'any':
            $('#gallery-gender-any').css('opacity', 1);
            break;
        default:
            $('#gallery-gender-all').css('opacity', 1);
            break;
    }
    
    updateGalleryScreen();
}

function galleryNextPage(){
    galleryPage++;
    loadThumbnails();
    $galleryEndings.css('opacity', '');
    $galleryPrevButton.attr('disabled', false);
    if(galleryPage+1==galleryPages){
        $galleryNextButton.attr('disabled', true);
    }
}

function galleryPrevPage(){
    galleryPage--;
    loadThumbnails();
    $galleryEndings.css('opacity', '');
    $galleryNextButton.attr('disabled', false);
    if(galleryPage==0){
        $galleryPrevButton.attr('disabled', true);
    }
}

function selectEnding(i) {
    selectedEnding = epp*galleryPage+i;
    var ending = galleryEndings[selectedEnding];

    if (!ending) {
        return;
    }
    
    if (ending.unlockHint) {
        $selectedEndingHint[0].show();
        $selectedEndingHint[1].html(ending.unlockHint);
    } else {
        $selectedEndingHint[0].hide();
    }

    if (ending.unlocked()) {
        $galleryStartButton.attr('disabled', false);
        $selectedEndingLabels[0].html(ending.title);
    } else {
        $galleryStartButton.attr('disabled', true);
        $selectedEndingLabels[0].html('');
    }
    
    $galleryEndings.css('opacity', '');
    $galleryEndings.eq(i).css('opacity', 1);
    loadEndingThunbnail($selectedEndingPreview, ending);
    $selectedEndingLabels[1].html(ending.player.metaLabel);
    $selectedEndingLabels[2].html(ending.gender);
    switch(ending.gender){
        case 'male':
            $selectedEndingLabels[2].removeClass('female-style');
            $selectedEndingLabels[2].addClass('male-style');
            break;
        case 'female':
            $selectedEndingLabels[2].removeClass('male-style');
            $selectedEndingLabels[2].addClass('female-style');
            break;
        default:
            $selectedEndingLabels[2].removeClass('female-style');
            $selectedEndingLabels[2].removeClass('male-style');
    }
}

function doEpilogueFromGallery(){
    var epilogue;
    if (!selectedEnding < 0 || !(epilogue = galleryEndings[selectedEnding])) {
        return;
    }

    var player = epilogue.player;
    $galleryStartButton.attr('disabled', true);
    
    player.fetchBehavior()
        /* Success callback.
         * 'this' is bound to the Opponent object.
         */
        .then(function($xml) {
            var endingElem = null;
            
            $xml.children('epilogue').each(function () {
                if ($(this).children('title').html() === epilogue.title && $(this).attr('gender') === epilogue.gender) {
                    endingElem = this;
                }
            });

            player.loadStylesheet();

            if($nameField.val()){
                humanPlayer.label = $nameField.val();
            } else {
                switch(epilogue.gender){
                    case "male": humanPlayer.label = "Mister"; break;
                    case "female" : humanPlayer.label = "Miss"; break;
                    default: humanPlayer.label = (humanPlayer.gender=="male")?"Mister":"Miss";
                }
            }
            
            // function definition in spniEpilogue.js
            epilogue = parseEpilogue(player, endingElem);

            /* Load forward-declarations for persistent markers. */
            $xml.find('persistent-markers>marker').each(function (i, elem) {
                var markerName = $(elem).text();
                player.persistentMarkers[markerName] = true;
            });

            /* Execute marker operations. */
            epilogue.markers.forEach(function(markerOp) {
                if (markerOp.from_gallery) {
                    markerOp.apply(player, null);
                }
            });
        
            if (USAGE_TRACKING) {
                recordEpilogueEvent(true, epilogue);
            }
        
            loadEpilogue(epilogue, null, true); //initialise buttons and text boxes
            screenTransition($galleryScreen, $epilogueScreen);
            $galleryStartButton.attr('disabled', false);
        });
}
