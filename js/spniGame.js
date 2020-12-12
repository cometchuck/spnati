/********************************************************************************
 This file contains the variables and functions that form the main game screen of
 the game. The main game progression (dealing, exchanging, revealing, stripping)
 and everything to do with displaying the main game screen.
 ********************************************************************************/

/**********************************************************************
 *****                    Game Screen UI Elements                 *****
 **********************************************************************/

/* game banner */
$gameBanner = $("#game-banner");

/* main UI elements */
$gameBubbles = [$("#game-bubble-1"),
                $("#game-bubble-2"),
                $("#game-bubble-3"),
                $("#game-bubble-4")];
$gameDialogues = [$("#game-dialogue-1"),
                  $("#game-dialogue-2"),
                  $("#game-dialogue-3"),
                  $("#game-dialogue-4")];
$gameImages = [$("#game-image-1"),
               $("#game-image-2"),
               $("#game-image-3"),
               $("#game-image-4")];
$gameLabels = [$(".game-name-label-0"),
               $("#game-name-label-1"),
               $("#game-name-label-2"),
               $("#game-name-label-3"),
               $("#game-name-label-4")];
$gameOpponentAreas = [$("#game-opponent-area-1"),
                      $("#game-opponent-area-2"),
                      $("#game-opponent-area-3"),
                      $("#game-opponent-area-4")];
$gamePlayerCountdown = $("#player-countdown");
$gamePlayerClothingArea = $("#player-game-clothing-area, #player-name-label-minimal");
$gamePlayerCardArea = $("#player-game-card-area");

/* dock UI elements */
$gameClothingLabel = $("#game-clothing-label");
$gameClothingCells = [$(".player-0-clothing-1"),
                      $(".player-0-clothing-2"),
                      $(".player-0-clothing-3"),
                      $(".player-0-clothing-4"),
                      $(".player-0-clothing-5"),
                      $(".player-0-clothing-6"),
                      $(".player-0-clothing-7"),
                      $(".player-0-clothing-8")];
$mainButton = $("#main-game-button");
$cardButtons = [$("#player-0-card-1"),
				$("#player-0-card-2"),
				$("#player-0-card-3"),
				$("#player-0-card-4"),
				$("#player-0-card-5")];
$debugButtons = [$("#debug-button-0"),
				 $("#debug-button-1"),
				 $("#debug-button-2"),
				 $("#debug-button-3"),
				 $("#debug-button-4")];

/* restart modal */
$restartModal = $("#restart-modal");

$logModal = $("#log-modal");
$logContainer = $('#log-container');

gameDisplays = [
    new GameScreenDisplay(1),
    new GameScreenDisplay(2),
    new GameScreenDisplay(3),
    new GameScreenDisplay(4)
];

/**********************************************************************
 *****                   Game Screen Variables                    *****
 **********************************************************************/

/* pseudo constants */
var GAME_DELAY = 800;
var FORFEIT_DELAY = null;
var ENDING_DELAY = null;
var GAME_OVER_DELAY = 1000;
var SHOW_ENDING_DELAY = 5000; //5 seconds
var CARD_SUGGEST = false;
var PLAYER_FINISHING_EFFECT = true;
var EXPLAIN_ALL_HANDS = true;
var AUTO_FADE = true;
var MINIMAL_UI = true;
var DEBUG = false;

/* game state
 * 
 * First element: text to display on main button to begin the phase
 * Second element: function to call when main button is clicked
 * Third element (optional): whether to automatically hide/show the table (if AUTO_FADE is set)
 * Fourth element (optional): whether to call tickForfeitTimers on main button click. 
 */
var eGamePhase = {
	DEAL:      [ "Deal", function() { startDealPhase(); }, true ],
	AITURN:    [ "Next", function() { continueDealPhase(); } ],
	EXCHANGE:  [ "Exchange", function() { completeExchangePhase(); }, true ],
	REVEAL:    [ "Reveal", function() { completeRevealPhase(); }, true ],
	PRESTRIP:  [ "Continue", function() { completeContinuePhase(); }, false ],
	STRIP:     [ "Strip", function() { completeStripPhase(); }, false ],
	FORFEIT:   [ "Masturbate", function() { completeMasturbatePhase(); }, false ],
	END_LOOP:  [ undefined, function() { handleGameOver(); } ],
	GAME_OVER: [ "Ending?", function() { actualMainButtonState = false; doEpilogueModal(); } ],
	END_FORFEIT: [ "Continue..." ], // Specially handled; not a real phase. tickForfeitTimers() will always return true in this state.
    EXIT_ROLLBACK: ['Return', function () { exitRollback(); }, undefined, false],
};

/* Masturbation Previous State Variables */
var gamePhase = eGamePhase.DEAL;
var globalSavedTableVisibility;

var inGame = false;
var currentTurn = 0;
var currentRound = -1;
var previousLoser = -1;
var recentLoser = -1;
var recentWinner = -1;
var gameOver = false;
var actualMainButtonState = false;
var endWaitDisplay = 0;
var showDebug = false;
var chosenDebug = -1;
var autoForfeitTimeoutID; // Remember this specifically so that it can be cleared if auto forfeit is turned off.
var repeatLog = {1:{}, 2:{}, 3:{}, 4:{}};

var transcriptHistory = [];

/*When in rollback, we store a RollbackPoint for the most current game state
   to returnRollbackPoint. 
  When exiting rollback, we load state from returnRollbackPoint.
  
  The only thing we don't load from a RollbackPoint is the game phase,
  since we set it to eGamePhase.EXIT_ROLLBACK.
  So, to make it available for bug reporting, we copy the game phase in the
  rollback point to rolledBackGamePhase.
 */
var returnRollbackPoint = null;
var rolledBackGamePhase = null;

/**********************************************************************
 *****                    Start Up Functions                      *****
 **********************************************************************/

/************************************************************
 * Loads all of the content required to display the title
 * screen.
 ************************************************************/
function loadGameScreen () {
    /* reset all of the player's states */
    for (var i = 1; i < players.length; i++) {
        gameDisplays[i-1].reset(players[i]);
    }
    $gameLabels[HUMAN_PLAYER].removeClass("loser tied current");
    clearHand(HUMAN_PLAYER);

    previousLoser = -1;
    recentLoser = -1;
    gameOver = false;

    $gamePlayerCardArea.show();
    $gamePlayerCountdown.hide();
    $gamePlayerCountdown.removeClass('pulse');
    chosenDebug = -1;
    updateDebugState(showDebug);
    
    /* randomize start lines for characters using legacy start lines.
     * The updateAllBehaviours() call below will override this for any
     * characters using new-style start lines.
     *
     * Also go ahead and commit any marker updates from selected lines.
     */
    players.forEach(function (p) {
        if(p.chosenState) {
            p.commitBehaviourUpdate();
        }
        
        if (p.startStates && p.startStates.length) {
            var newState = new State(p.startStates[getRandomNumber(0, p.startStates.length)]);
            p.updateChosenState(newState);
        }
    }.bind(this));

    updateAllBehaviours(null, null, GAME_START);
    updateBiggestLead();

    /* set up the poker library */
    setupPoker();

    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
        $cardButtons[i].attr('disabled', true);
    }

    /* enable and set up the main button */
	allowProgression(eGamePhase.DEAL);
}

/**********************************************************************
 *****                      Display Functions                     *****
 **********************************************************************/

/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateGameVisual (player) {
    if (inGame) {
        gameDisplays[player-1].update(players[player]);
    }
}

/************************************************************
 * Adds lines to the repeat count and displays if the count > 1.
 ************************************************************/
 function appendRepeats(slot) {
    var current = $gameDialogues[slot-1].html();
    repeatLog[slot][current] = repeatLog[slot][current] + 1 || 1;
    if (repeatLog[slot][current] > 1) {
        $gameDialogues[slot-1].html(current + "<br><span style=\"color:red;\">(" + repeatLog[slot][current] + ")<\span>");
    }
}


/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateAllGameVisuals () {
    /* update all opponents */
    for (var i = 1; i < players.length; i++) {
        updateGameVisual (i);
    }
}

/************************************************************
 * Updates the visuals of the player clothing cells.
 ************************************************************/
function displayHumanPlayerClothing () {
    /* collect the images */
    var clothingImages = humanPlayer.clothing.map(function(c) {
		return { src: c.image,
                 alt: c.name.initCap() };
	});
    
    /* display the remaining clothing items */
    clothingImages.reverse();
	$gameClothingLabel.html("Your Clothing");
	for (var i = 0; i < 8; i++) {
		if (clothingImages[i]) {
			$gameClothingCells[i].attr(clothingImages[i]);
			$gameClothingCells[i].css({opacity: 1});
		} else {
			$gameClothingCells[i].css({opacity: 0});
		}
	}
}

/**********************************************************************
 *****                        Flow Functions                      *****
 **********************************************************************/

/************************************************************
 * Determines what the AI's action will be.
 ************************************************************/
function makeAIDecision () {
    detectCheat();
	/* determine the AI's decision */
	determineAIAction(players[currentTurn]);
	
	/* update a few hardcoded visuals */
	players[currentTurn].swapping = true;
	players[currentTurn].updateBehaviour(SWAP_CARDS);
    players[currentTurn].commitBehaviourUpdate();
    
    saveSingleTranscriptEntry(currentTurn);

    /* wait and implement AI action */
    var n = players[currentTurn].hand.tradeIns.countTrue();
    exchangeCards(currentTurn);
    timeoutID = window.setTimeout(reactToNewAICards,
                                  Math.max(GAME_DELAY, n ? (n - 1) * ANIM_DELAY + ANIM_TIME + GAME_DELAY / 4 : 0));
}

/************************************************************
 * React to the new cards
 ************************************************************/
function reactToNewAICards () {
	/* update behaviour */
    players[currentTurn].hand.determine();
	if (players[currentTurn].hand.strength == HIGH_CARD) {
		players[currentTurn].updateBehaviour([BAD_HAND, ANY_HAND]);
	} else if (players[currentTurn].hand.strength == PAIR) {
		players[currentTurn].updateBehaviour([OKAY_HAND, ANY_HAND]);
	} else {
		players[currentTurn].updateBehaviour([GOOD_HAND, ANY_HAND]);
	}
    
    players[currentTurn].commitBehaviourUpdate();
    
    players[currentTurn].swapping = false;
    
    saveSingleTranscriptEntry(currentTurn);

	/* wait and then advance the turn */
	timeoutID = window.setTimeout(advanceTurn, GAME_DELAY / 2);
}

/************************************************************
 * Advances the turn or ends the round.
 ************************************************************/
function advanceTurn () {
	currentTurn++;
	if (currentTurn >= players.length) {
		currentTurn = 0;
    }

    if (players[currentTurn]) {
        /* highlight the player who's turn it is */
        for (var i = 0; i < players.length; i++) {
            if (currentTurn == i) {
                $gameLabels[i].addClass("current");
                if (i > 0) $gameOpponentAreas[i-1].addClass('current');
            } else {
                $gameLabels[i].removeClass("current");
                if (i > 0) $gameOpponentAreas[i-1].removeClass('current');
            }
        }

        /* check to see if they are still in the game */
        if (players[currentTurn].out && currentTurn > 0) {
            /* update their speech and skip their turn */
            players[currentTurn].updateBehaviour(players[currentTurn].forfeit[0]);
            players[currentTurn].commitBehaviourUpdate();
            
            saveSingleTranscriptEntry(currentTurn);

            timeoutID = window.setTimeout(advanceTurn, GAME_DELAY);
            return;
        }
    }

	/* allow them to take their turn */
	if (currentTurn == 0) {
        /* Reprocess reactions. */
        updateAllVolatileBehaviours();
        
        commitAllBehaviourUpdates();

        /* human player's turn */
        if (humanPlayer.out) {
			allowProgression(eGamePhase.REVEAL);
		} else {
            $gameScreen.addClass('prompt-exchange');
			allowProgression(eGamePhase.EXCHANGE);
		}
	} else if (!players[currentTurn]) {
        /* There is no player here, move on. */
        advanceTurn();
    } else {
        /* AI player's turn */
		makeAIDecision();
	}
}

/************************************************************
 * Deals cards to each player and resets all of the relevant
 * information.
 ************************************************************/
function startDealPhase () {
    currentRound++;
    saveTranscriptMessage("Starting round "+(currentRound+1)+"...");

    if (SENTRY_INITIALIZED) {
        Sentry.addBreadcrumb({
            category: 'game',
            message: 'Starting round '+(currentRound+1)+'...',
            level: 'info'
        });
    }
    
    /* dealing cards */
	dealLock = getNumPlayersInStage(STATUS_ALIVE) * CARDS_PER_HAND;
    for (var i = 0; i < players.length; i++) {
        if (players[i]) {
            /* collect the player's hand */
            clearHand(i);
            
            if (i !== 0) {
                $gameOpponentAreas[i-1].removeClass('opponent-revealed-cards opponent-lost');
            }
        }
    }

    setupDeck();

    var numPlayers = getNumPlayersInStage(STATUS_ALIVE);

    var n = 0;
    for (var i = 0; i < players.length; i++) {
        if (players[i]) {
            console.log(players[i] + " "+ i);
            if (!players[i].out) {
                /* deal out a new hand to this player */
                dealHand(i, numPlayers, n++);
            } else {
                if (HUMAN_PLAYER == i) {
                    $gamePlayerCardArea.hide();
                    $gamePlayerClothingArea.hide();
                }
                else {
                    $gameOpponentAreas[i-1].hide();
                }
            }
            players[i].timeInStage++;
        }
    }

	/* IMPLEMENT STACKING/RANDOMIZED TRIGGERS HERE SO THAT AIs CAN COMMENT ON PLAYER "ACTIONS" */

	/* clear the labels */
	for (var i = 0; i < players.length; i++) {
		$gameLabels[i].removeClass("loser tied");
	}

	timeoutID = window.setTimeout(checkDealLock, ANIM_DELAY * CARDS_PER_HAND * numPlayers + ANIM_TIME);
}

/************************************************************
 * Checks the deal lock to see if the animation is finished.
 ************************************************************/
function checkDealLock () {
	/* check the deal lock */
	if (dealLock > 0) {
		timeoutID = window.setTimeout(checkDealLock, 100);
	} else {
        gamePhase = eGamePhase.AITURN;
        
        /* Set up main button.  If there is not pause for the human
		   player to exchange cards, and someone is masturbating, and
		   the card animation speed is to great, we need a pause so
		   that the masturbation talk can be read. */
        if (humanPlayer.out && getNumPlayersInStage(STATUS_MASTURBATING) > 0 && ANIM_DELAY < 100) {
            allowProgression();
        } else {
            continueDealPhase();
        }
    }
}

/************************************************************
 * Finishes the deal phase and allows the game to progress.
 ************************************************************/
function continueDealPhase () {
	/* hide the dialogue bubbles */
    for (var i = 1; i < players.length; i++) {
        $gameDialogues[i-1].html("");
        $gameBubbles[i-1].hide();
    }

	$mainButton.html("Wait...");
    
    /* enable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', false);
    }

	/* suggest cards to swap, if enabled */
	if (CARD_SUGGEST && !humanPlayer.out) {
		determineAIAction(humanPlayer);
		
		/* dull the cards they are trading in */
		for (var i = 0; i < humanPlayer.hand.tradeIns.length; i++) {
			if (humanPlayer.hand.tradeIns[i]) {
				dullCard(HUMAN_PLAYER, i);
			}
		}
	}

    /* Clear all player's chosenStates to allow for limited (in-order-only)
     * reaction processing during the AI turns.
     * (Handling of out-of-order reactions happens at the beginning of the
     *  player turn.)
     */
    players.forEach(function (p) {
        if (p.chosenState) {
            p.clearChosenState();
        }
    });

    /* allow each of the AIs to take their turns */
    currentTurn = 0;
    advanceTurn();
}

/************************************************************
 * Processes everything required to complete the exchange phase
 * of a round. Trades in the cards the player has selected and
 * draws new ones.
 ************************************************************/
function completeExchangePhase () {
    detectCheat();
    /* exchange the player's chosen cards */
    exchangeCards(HUMAN_PLAYER);
    
    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', true);
    }
    $gameLabels[HUMAN_PLAYER].removeClass("current");
    allowProgression(eGamePhase.REVEAL);
}

/************************************************************
 * Processes everything required to complete the reveal phase
 * of a round. Shows everyone's hand and determines who lost
 * the hand.
 ************************************************************/
function completeRevealPhase () {
    detectCheat();
    stopCardAnimations(); // If the player was impatient
    /* reveal everyone's hand */
    for (var i = 0; i < players.length; i++) {
        if (players[i] && !players[i].out) {
            players[i].hand.determine();
            players[i].hand.sort();
            showHand(i);
            
            if (i > 0) $gameOpponentAreas[i-1].addClass('opponent-revealed-cards');
        }
    }

    /* Sort players by their hand strengths, worst first. */
    var sortedPlayers = players.filter(function(p) { return !p.out; });
    sortedPlayers.sort(function(p1, p2) { return compareHands(p1.hand, p2.hand); });

    if (chosenDebug !== -1 && DEBUG) {
        previousLoser = recentLoser;
        recentLoser = chosenDebug;
    } else {
        /* Check if (at least) the two worst hands are equal. */
        if (compareHands(sortedPlayers[0].hand, sortedPlayers[1].hand) == 0) {
            console.log("Fuck... there was an absolute tie");
            /* inform the player */
            players.forEach(function (p) {
                if (p.chosenState) {
                    p.clearChosenState();
                    updateGameVisual(p.slot);
                }
            });
            updateAllBehaviours(null, null, PLAYERS_TIED);

            /* The probability of a three-way tie is basically zero,
             * but it's theoretically possible. */
            for (var i = 0;
                 i < 2 || (i < sortedPlayers.length
                           && compareHands(sortedPlayers[0].hand,
                                           sortedPlayers[i].hand) == 0);
                 i++) {
                $gameLabels[sortedPlayers[i].slot].addClass("tied");
            };
            /* reset the round */
            allowProgression(eGamePhase.DEAL);
            return;
        }
        previousLoser = recentLoser;
        recentLoser = sortedPlayers[0].slot;
    }
    recentWinner = sortedPlayers[sortedPlayers.length-1].slot;

    console.log("Player "+recentLoser+" is the loser.");
    if (SENTRY_INITIALIZED) {
        Sentry.addBreadcrumb({
            category: 'game',
            message: players[recentLoser].id+' lost the round',
            level: 'info'
        });
    }

    // update loss history
    if (recentLoser == previousLoser) {
        // same player lost again
        players[recentLoser].consecutiveLosses++;
    } else {
        // a different player lost
        players[recentLoser].consecutiveLosses = 1;
        if (previousLoser >= 0) players[previousLoser].consecutiveLosses = 0; //reset last loser
    }

    /* update behaviour */
    saveTranscriptMessage("<b>"+players[recentLoser].label+"</b> has lost the hand.");
	var clothes = playerMustStrip (recentLoser);
    
    /* playerMustStrip() calls updateAllBehaviours. */

    /* highlight the loser */
    for (var i = 0; i < players.length; i++) {
        if (recentLoser == i) {
            $gameLabels[i].addClass("loser");
            
            if (i > 0) $gameOpponentAreas[i-1].addClass('opponent-lost');
        }
    }

    /* set up the main button */
	if (recentLoser != HUMAN_PLAYER && clothes > 0) {
		allowProgression(eGamePhase.PRESTRIP);
	} else if (clothes == 0) {
		allowProgression(eGamePhase.FORFEIT);
	} else {
		allowProgression(eGamePhase.STRIP);
	}

}

/************************************************************
 * Processes everything required to complete the continue phase
 * of a round. A very short phase in which a player removes an
 * article of clothing.
 ************************************************************/
function completeContinuePhase () {
	/* show the player removing an article of clothing */
	prepareToStripPlayer(recentLoser);
    allowProgression(eGamePhase.STRIP);
}

/************************************************************
 * Processes everything required to complete the strip phase
 * of a round. Makes the losing player strip.
 ************************************************************/
function completeStripPhase () {
    /* strip the player with the lowest hand */
    stripPlayer(recentLoser);
}

/************************************************************
 * Processes everything required to complete the strip phase of a
 * round when the loser has no clothes left. Makes the losing player
 * start their forfeit. May also end the game if only one player
 * remains.
 ************************************************************/
function completeMasturbatePhase () {
    /* strip the player with the lowest hand */
    startMasturbation(recentLoser);
}

/************************************************************
 * Handles everything that happens at the end of the round.
 * Including the checks for the end of game.
 ************************************************************/
function endRound () {
	/* check to see how many players are still in the game */
    var inGame = 0;
    var lastPlayer = 0;
    for (var i = 0; i < players.length; i++) {
        if (players[i] && !players[i].out) {
            inGame++;
            lastPlayer = i;
        }
    }

    /* if there is only one player left, end the game */
    if (inGame <= 1) {
        if (USAGE_TRACKING) {
            recordEndGameEvent(players[lastPlayer].id);
        }
        
		console.log("The game has ended!");
		$gameBanner.html("Game Over! "+players[lastPlayer].label+" won Strip Poker Night at the Inventory!");
		gameOver = true;

        if (SENTRY_INITIALIZED) {
            Sentry.addBreadcrumb({
                category: 'game',
                message: 'Game ended with '+players[lastPlayer].id+' winning.',
                level: 'info'
            });
        }

        for (var i = 0; i < players.length; i++) {
            if (HUMAN_PLAYER == i) {
                $gamePlayerCardArea.hide();
                $gamePlayerClothingArea.hide();
            }
            else {
                $gameOpponentAreas[i-1].hide();
            }
        }
        endWaitDisplay = 0;
		handleGameOver();
	} else {
        updateBiggestLead();
		allowProgression(eGamePhase.DEAL);
		ACTIVE_CARD_IMAGES.preloadImages();
	}
}

/************************************************************
 * Handles the end of the game. Currently just waits for all
 * players to finish their forfeits.
 ************************************************************/
function handleGameOver() {
	var winner;

	/* determine true end and identify winner (even though endRound() did that too) */
	if (!players.some(function(p, i) {
		if (!p.out) winner = p;
		return p.out && !p.finished;
	})) {
		/* true end */
        updateAllBehaviours(winner.slot, GAME_OVER_VICTORY, GAME_OVER_DEFEAT);

		allowProgression(eGamePhase.GAME_OVER);
		//window.setTimeout(doEpilogueModal, SHOW_ENDING_DELAY); //start the endings
	} else {
		if (endWaitDisplay == 0) {
			players.forEach(function(p) { p.timeInStage++; });
		}
		allowProgression(eGamePhase.END_LOOP);
	}
}

/**********************************************************************
 *****                    Interaction Functions                   *****
 **********************************************************************/

/************************************************************
 * The player selected one of their cards.
 ************************************************************/
function selectCard (card) {
	humanPlayer.hand.tradeIns[card] = !humanPlayer.hand.tradeIns[card];
	
	if (humanPlayer.hand.tradeIns[card]) {
		dullCard(HUMAN_PLAYER, card);
	} else {
		fillCard(HUMAN_PLAYER, card);
	}
}

function getGamePhaseString(phase) {
    var keys = Object.keys(eGamePhase);
    for (var i=0;i<keys.length;i++) {
        if (eGamePhase[keys[i]] === phase) return keys[i];
    }
}

/************************************************************
 * Allow progression by enabling the main button *or*
 * setting up the auto forfeit timer.
 ************************************************************/
function allowProgression (nextPhase) {
	if (nextPhase !== undefined && nextPhase !== eGamePhase.END_FORFEIT) {
		gamePhase = nextPhase;
	} else if (nextPhase === undefined) {
		nextPhase = gamePhase;
	}
	
    if (FORFEIT_DELAY && nextPhase != eGamePhase.GAME_OVER && humanPlayer.out && humanPlayer.timer > 1) {
        timeoutID = autoForfeitTimeoutID = setTimeout(advanceGame, FORFEIT_DELAY);
    } else if (ENDING_DELAY && nextPhase != eGamePhase.GAME_OVER && (humanPlayer.finished || (!humanPlayer.out && gameOver))) {
        /* Human is finished or human is the winner */
        timeoutID = autoForfeitTimeoutID = setTimeout(advanceGame, ENDING_DELAY);
    } else {
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
    }

	if (humanPlayer.out && !humanPlayer.finished && humanPlayer.timer == 1 && gamePhase != eGamePhase.STRIP) {
		$mainButton.html("Cum!");
	} else if (nextPhase[0]) {
		$mainButton.html(nextPhase[0]);
	} else if (nextPhase === eGamePhase.END_LOOP) { // Special case
        var dots = "";
        for (var i = 0; i < endWaitDisplay; i++) {
            dots += ".";
        }
        endWaitDisplay = (endWaitDisplay + 1) % 4;
        
		/* someone is still forfeiting */
        if (humanPlayer.checkStatus(STATUS_MASTURBATING)) {
            $mainButton.html("<small>Keep going" + dots + "</small>");
        } else {
            $mainButton.html("Wait" + dots);
        }
	}
}

/************************************************************
 * The player clicked the main button on the game screen.
 ************************************************************/
function advanceGame () {    
    /* disable the button to prevent double clicking */
    $mainButton.attr('disabled', true);
    actualMainButtonState = true;
    autoForfeitTimeoutID = undefined;
    
    /* lower the timers of everyone who is forfeiting */
    if (gamePhase[3] !== false && tickForfeitTimers()) return;

	if (AUTO_FADE && gamePhase[2] !== undefined) {
		forceTableVisibility(gamePhase[2]);
	}
	gamePhase[1]();
}

/************************************************************
 * The player clicked the home button. Shows the restart modal.
 ************************************************************/
function showRestartModal () {
    $restartModal.modal('show');
}

function closeRestartModal() {
	$mainButton.attr('disabled', actualMainButtonState);
}

/************************************************************
 * Functions and classes for the dialogue transcript and rollback.
 ************************************************************/

/************************************************************
 * Encapsulates character state info for rollback.
 * A lot of this data isn't actually user-visible,
 * but is kept to support accurate submission of bug reports
 * from a rolled-back state.
 ************************************************************/
function RollbackPoint (logPlayers) {
    this.playerData = [];
    
    players.forEach(function (p) {
        var data = {};
        
        data.slot = p.slot;
        data.stage = p.stage;
        data.timeInStage = p.timeInStage;
        data.markers = {};
        
        for (let marker in p.markers) {
            data.markers[marker] = p.markers[marker];
        }
        
        if (p.chosenState) data.chosenState = new State(p.chosenState);
        
        this.playerData.push(data);
    }.bind(this));
    
    /* Record data for bug reporting purposes. */
    this.currentRound = currentRound;
    this.currentTurn = currentTurn;
    this.previousLoser = previousLoser;
    this.recentLoser = recentLoser;
    this.recentWinner = recentWinner;
    this.gameOver = gameOver;
    this.gamePhase = gamePhase;
    
    this.logEntries = [];
    
    if (logPlayers) {
        logPlayers.forEach(function (p) {
            if (!players[p]) return;
            
            this.logEntries.push([
                players[p].label,
                players[p].chosenState ? players[p].chosenState.dialogue : ''
            ]);
        }.bind(this));
    }
}

RollbackPoint.prototype.load = function () {
    if (!returnRollbackPoint) {
        returnRollbackPoint = new RollbackPoint();
        allowProgression(eGamePhase.EXIT_ROLLBACK);
    }

    if (SENTRY_INITIALIZED) {
        Sentry.addBreadcrumb({
            category: 'ui',
            message: 'Entering rollback.',
            level: 'info'
        });
    }
    
    currentRound = this.currentRound;
    currentTurn = this.currentTurn;
    previousLoser = this.previousLoser;
    recentLoser = this.recentLoser;
    recentWinner = this.recentWinner;
    gameOver = this.gameOver;
    rolledBackGamePhase = this.gamePhase;
    
    this.playerData.forEach(function (p) {
        var loadPlayer = players[p.slot];
        
        loadPlayer.stage = p.stage;
        loadPlayer.timeInStage = p.timeInStage;
        loadPlayer.markers = p.markers;
        loadPlayer.chosenState = p.chosenState;
    }.bind(this));
    
    updateAllGameVisuals();
}

function inRollback() {
    return (!!returnRollbackPoint);
}

function exitRollback() {
    if (!inRollback()) return;

    if (SENTRY_INITIALIZED) {
        Sentry.addBreadcrumb({
            category: 'ui',
            message: 'Exiting rollback.',
            level: 'info'
        });
    }
    
    returnRollbackPoint.load();
    allowProgression(returnRollbackPoint.gamePhase);
    returnRollbackPoint = null;
}

/* Adds a log message to the dialogue transcript */
function saveTranscriptMessage(msg) {
    transcriptHistory.push(msg)
}

/* Creates a rollback point associated with a specified list of players. */
function saveTranscriptEntries(players) {
    transcriptHistory.push(new RollbackPoint(players));
}
 

/* Creates a rollback point associated with a single entry in the dialogue
 * transcript.
 */
function saveSingleTranscriptEntry (player) {
    saveTranscriptEntries([player]);
}

/* Creates a rollback point associated with entries for all players
 * in the dialogue transcript.
 */
function saveAllTranscriptEntries () {
    saveTranscriptEntries([1, 2, 3, 4]);
}

 
/************************************************************
 * Creates a DOM element for a log entry.
 ************************************************************/
function createLogEntryElement(label, text, pt) {
    var container = document.createElement('div');
    container.className = "log-entry-container clearfix";
    
    var labelElem = document.createElement('b');
    labelElem.className = "log-entry-label";
    $(labelElem).html(label);
    
    var textElem = document.createElement('div');
    textElem.className = "log-entry-text";
    $(textElem).html(text);
    
    container.appendChild(labelElem);
    container.appendChild(textElem);
    
    container.onclick = function (ev) {
        pt.load();
        $logModal.modal('hide');
    }
    
    return container;
}

/************************************************************
* Creates a DOM element for a logged game message.
************************************************************/
function createLogMessageElement(text) {
    var container = document.createElement('div');
    container.className = "log-entry-container clearfix";
    container.style = "opacity: 1; text-align:center;";
    
    var textElem = document.createElement('i');
    textElem.className = "log-entry-message";
    $(textElem).html(text);
    
    container.appendChild(textElem);
    
    return container;
}

/************************************************************
 * The player clicked the log button. Shows the log modal.
 ************************************************************/
function showLogModal () {
    $logContainer.empty();
    
    transcriptHistory.forEach(function (pt) {
        if (pt instanceof RollbackPoint) {
            pt.logEntries.forEach(function (e) {
                logText = fixupDialogue(e[1]);
                logText = logText.replace(/<script>.+<\/script>/g, '');
                logText = logText.replace(/<button[^>]+>[^<]+<\/button>/g, '');
        
                $logContainer.append(createLogEntryElement(e[0], logText, pt));
            });
        } else {
            $logContainer.append(createLogMessageElement(pt));
        }
    });
    
    $logModal.modal('show');
}


/************************************************************
 * A keybound handler.
 ************************************************************/
function game_keyUp(e)
{
    console.log(e);
    if ($('.modal:visible').length == 0 && $('#game-screen .dialogue-edit:visible').length == 0) {
        if (e.keyCode == 32 && !$mainButton.prop('disabled')) { // Space
			e.preventDefault();
            advanceGame();
        }
        else if (e.keyCode == 49 && !$cardButtons[0].prop('disabled')) { // 1
            selectCard(0);
        }
        else if (e.keyCode == 50 && !$cardButtons[1].prop('disabled')) { // 2
            selectCard(1);
        }
        else if (e.keyCode == 51 && !$cardButtons[2].prop('disabled')) { // 3
            selectCard(2);
        }
        else if (e.keyCode == 52 && !$cardButtons[3].prop('disabled')) { // 4
            selectCard(3);
        }
        else if (e.keyCode == 53 && !$cardButtons[4].prop('disabled')) { // 5
            selectCard(4);
        }
        else if (e.keyCode == 81 && DEBUG) { // Q
            showDebug = !showDebug;
            updateDebugState(showDebug);
            setDevSelectorVisibility(showDebug);
        }
        else if (e.keyCode == 84) { // T
            toggleTableVisibility();
        }
    }
}
$gameScreen.data('keyhandler', game_keyUp);

function selectDebug(player)
{
    if (chosenDebug === player) {
        chosenDebug = -1;
    }
    else {
        chosenDebug = player;
    }
    updateDebugState(showDebug);
}


function updateDebugState(show)
{
    if (!show) {
        for (var i = 0; i < $debugButtons.length; i++) {
            $debugButtons[i].hide();
        }
    }
    else {
        for (var i = 0; i < $debugButtons.length; i++) {
            if (players[i] && !players[i].out) {
                $debugButtons[i].show();
                $debugButtons[i].removeClass("active");
            }
        }

        if (chosenDebug !== -1) {
            $debugButtons[chosenDebug].addClass("active");
        }
    }
}

function detectCheat() {
    /* detect common cheating attempt */
    if (humanPlayer.hand && humanPlayer.hand.cards[0] === "clubs10") {
        players.forEach(function(p, i) {
            if (i == 0) {
                players[i].hand.cards = [ 7, 5, 4, 3, 2 ].map(function(n, i) { return new Card(i % 4, n); });
            } else {
                players[i].hand.cards = [ 14, 13, 12, 11, 10 ].map(function(n) { return new Card(i - 1, n); });
            }
        });
        $('button[onclick^=makeLose]').remove();
        delete makeLose;
        alert("Sorry, but you tried to use an outdated cheat, which would previously have crashed the game. Instead, you will now lose the round.\n\n"+
              "We will now refer you to the FAQ for a few basic strategy tips and information on how to cheat in the proper manner.");
        gotoHelpPage(3);
        showHelpModal();
    }
}
