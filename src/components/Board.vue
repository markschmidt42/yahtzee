<template>
  <div :style="{ transform: 'scale(' + zoomScale + ')' }">
    <div v-if="whatWasHeard" class="what-was-heard" v-html="whatWasHeard"></div>
    <div v-if="mode == 'add-players'" class="add-players-container">
      <h2>Add Players:</h2>
      <input
        ref="newPlayer"
        v-model="newPlayerName"
        type="text"
        maxlength="8"
        @keyup.enter="handleAddPlayer"
      />
      <div class="btn-container">
        <button href="#" @click="handleAddPlayer">Add Player</button>
        <button v-if="players.length > 0" href="#" @click="startGame">
          Play Yahtzee
        </button>
      </div>
      <ol>
        <transition-group name="player-add-remove">
          <li
            v-for="(player, pix) in players"
            :key="player.name"
            class="player"
            :name="player.name"
            @click="handleRemovePlayer(pix)"
          >
            {{ player.name }}
          </li>
        </transition-group>
      </ol>

      <div class="voice-help">
        <strong>Say:</strong>
        <ul>
          <li>"Add Jane"</li>
          <li>"Add player Jane"</li>
          <li>"Add Jane, John and Bill"</li>
          <li>"Add player Jane, John and Bill"</li>
          <li v-if="players.length > 0">"Remove last player"</li>
          <li v-if="players.length > 0">"Start/Play (the) game"</li>
          <li v-if="players.length > 0">"Play Yahtzee"</li>
        </ul>
      </div>
    </div>

    <transition name="slide-up-fade">
      <div v-if="mode != 'add-players'">
        <div v-for="section in sections" :key="section.name" class="board">
          <div class="col label">
            <div
              v-if="section.showHeader"
              :class="section.code"
              class="header cell"
            >
              <h3>{{ section.name }}</h3>
            </div>

            <div
              v-for="category in section.categories"
              :key="category.code"
              :class="section.code"
              class="cell category"
            >
              <strong>{{ category.name }}</strong>
              <div class="how">{{ category.how }}</div>
            </div>

            <div
              v-for="total in section.totals"
              :key="total.code"
              :class="section.code"
              class="cell total"
            >
              {{ total.name }}
              <div v-if="total.how" class="how">{{ total.how }}</div>
            </div>
          </div>

          <div
            v-for="(player, pix) in players"
            :key="player.name"
            :class="[player.isCurrent ? 'current' : '']"
            class="col player"
            :name="player.name"
          >
            <div
              v-if="section.showHeader"
              :class="section.code"
              class="header cell"
            >
              <h3>{{ player.name.substr(0, 7) }}</h3>
            </div>

            <div
              v-for="category in section.categories"
              :key="category.code"
              class="cell category"
            >
              <ScoreInput
                :category="category"
                type="category"
                :player-index="pix"
                :player="player"
                :value="getScore(player, category)"
              />
            </div>

            <div
              v-for="total in section.totals"
              :key="total.code"
              :class="section.code"
              class="cell total"
            >
              <ScoreInput
                :category="total"
                type="total"
                :value="player.scores[total.code] || 0"
              />
            </div>
          </div>
        </div>
        <!-- end board -->
      </div>
    </transition>

    <transition name="slide-left-fade">
      <div v-if="mode != 'add-players'" class="scoreboard">
        <div v-if="mode == 'playing'">
          <div class="rounds">
            Round
            <strong>{{ round }}</strong>
            of {{ roundMax }}
          </div>
          <div class="roundsLeft">
            {{ 1 + roundMax - round }} play{{
              1 + roundMax - round != 1 ? 's' : ''
            }}
            left
          </div>
        </div>
        <transition name="bounce">
          <div v-if="mode === 'end'">
            <div class="rounds">GAME OVER</div>
            <div class="winner">
              <h4>
                {{ getPlayersByScore()[0].name }}
                <br />IS THE WINNER
              </h4>
            </div>
          </div>
        </transition>

        <div class="leaderboard">
          <h4>Yahtzee Leaderboard</h4>
          <div
            v-for="player in getPlayersByScore()"
            :key="player.name"
            :class="['placement-' + player.currentPosition]"
            :name="player.name"
          >
            <div class="item">
              <div class="placement" v-html="getPlacement(player)"></div>
              <div class="name">{{ player.name }}</div>
              <div class="score">{{ player.final }}</div>
            </div>
          </div>
        </div>

        <div v-if="mode !== 'end'" class="turn-info">
          <h4>{{ players[currentPlayerIndex].name }}'s Turn</h4>
          <div v-for="category in getPlayerCategories()" :key="category.code">
            <div
              :class="[category.sectionCode, { used: category.hasScore }]"
              class="cell category"
            >
              {{ category.name }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- one modal -->
    <modal name="hello-world">hello, world!</modal>
  </div>
</template>
<script>
/*
 x git repo
 x Players fixed-with col
 x have leader board on far right (sam is current and placent)
  x have current info "Addison is up"
  x have round 3/13 or whatever
 x pass full player and full category to input
 x on input, if player is not current or if it already has a score... you need to double click to access it
 x if it was a double click, and a score was saved, pass (outOfOrderEntry = true)
    x then we know not to select "next" player
 - center the while thing
 - add v-if transitions
 x make the score input
 - add the trophy/medals to the leader board (new function that returns image path (or v-html and the whole img tag))
 - smart sizing, use the whole screen (height and width) TOUGH (on resize, just mess with zoom/scale?)
 x add players
    x (remove players)
    - reorder players (v3), for now, you have to remove and ad in the right order
    x Start game
 x voice control
- add sounds
- add visual/audio feedback on last score entered (light up green fade out, make sound)
- don't allow adding of the same player
*/

// third-party
import annyang from 'annyang';

// services
import { EventBus } from '../event-bus';
import categoryService from '../services/category.service';
import soundService from '../services/sound.service';

// components
import ScoreInput from './ScoreInput.vue';
import randomService from '../services/random.service';

const utils = {
  // eslint-disable-next-line
  toTitleCase: (str) => {
    // eslint-disable-next-line
    return str.replace(
      /\w\S*/g,
      // eslint-disable-next-line
      function (txt) {
        // eslint-disable-next-line
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  },
};

export default {
  name: 'Board',
  components: {
    ScoreInput,
  },
  data: () => ({
    zoomScale: 1,
    WhatWasHeardTimeout: null,
    whatWasHeard: null,
    mode: 'add-players',
    newPlayerName: '',
    round: 1,
    roundMax: 13,
    currentPlayerIndex: 0,
    players: [],
    sections: [
      {
        name: 'Upper Section',
        code: 'upper-section',
        showHeader: true,
        categories: [
          {
            code: '1s',
            name: 'Aces',
            how: 'Count and add only Aces',
            type: 'upper',
            options: [1, 2, 3, 4],
            listenFor: ['one', 'ones', 'aces', '1s', '1'],
          },
          {
            code: '2s',
            name: 'Twos',
            how: 'Count and add only Twos',
            type: 'upper',
            options: [2, 4, 6, 8],
            listenFor: ['two', 'twos', '2s', '2'],
          },
          {
            code: '3s',
            name: 'Threes',
            how: 'Count and add only Threes',
            type: 'upper',
            options: [3, 6, 9, 12],
            listenFor: ['three', 'threes', '3s', '3'],
          },
          {
            code: '4s',
            name: 'Fours',
            how: 'Count and add only Fours',
            type: 'upper',
            options: [4, 8, 12, 16],
            listenFor: ['four', 'fours', '4s', '4', 'floors', 'force'],
          },
          {
            code: '5s',
            name: 'Fives',
            how: 'Count and add only Fives',
            type: 'upper',
            options: [5, 10, 15, 20],
            listenFor: ['five', 'fives', '5s', '5'],
          },
          {
            code: '6s',
            name: 'Sixes',
            how: 'Count and add only Sixes',
            type: 'upper',
            options: [6, 12, 18, 24],
            listenFor: ['six', 'sixes', '6s', '6', 'sixers'],
          },
        ],
        totals: [
          {
            code: 'uts',
            name: 'Total',
            calc: ['1s', '2s', '3s', '4s', '5s', '6s'],
          },
          {
            code: 'bonus',
            name: 'Bonus',
            how: 'If total score is >= 63. +35',
            calc: 'upper-bonus',
          },
          { code: 'ugt', name: 'Upper Total', calc: ['uts', 'bonus'] },
        ],
      },
      {
        name: 'Lower Section',
        code: 'lower-section',
        showHeader: true,
        categories: [
          {
            code: '3oak',
            name: '3 of a Kind',
            how: 'Add total of all dice',
            options: null,
            listenFor: ['3 of a kind', 'three of a kind'],
          },
          {
            code: '4oak',
            name: '4 of a Kind',
            how: 'Add total of all dice',
            listenFor: ['4 of a kind', 'four of a kind'],
            options: null,
          },
          {
            code: 'fh',
            name: 'Full House',
            how: 'Score 25',
            type: 'on-off',
            options: [25],
            listenFor: ['full house'],
          },
          {
            code: 'smst',
            name: 'Sm Straight',
            how: 'Score 30',
            type: 'on-off',
            options: [30],
            listenFor: ['small straight', 'small strait', 'small street'],
          },
          {
            code: 'lgst',
            name: 'Lg Straight',
            how: 'Score 40',
            type: 'on-off',
            options: [40],
            listenFor: ['large straight', 'large strait', 'large street'],
          },
          {
            code: 'yhtz',
            name: 'Yahtzee',
            how: 'Score 50',
            type: 'on-off',
            options: [50],
            listenFor: ['yahtzee', 'yacht zee', 'yacht Z', 'yats zee'],
          },
          {
            code: 'chnc',
            name: 'Chance',
            how: 'Add total of all dice',
            options: null,
            listenFor: ['chance', 'champ', 'champs'],
          },
          {
            code: 'yb',
            name: 'Yahtzee Bonus',
            how: 'Score 100 per',
            type: 'yahtzee-bonus',
            options: [100, 200, 300, 400],
            listenFor: [
              'yahtzee bonus',
              'yacht zee bonus',
              'yacht Z bonus',
              'yats zee bonus',
            ],
          },
        ],
        totals: [
          {
            code: 'flts',
            name: 'Lower Total',
            calc: ['3oak', '4oak', 'fh', 'smst', 'lgst', 'yhtz', 'chnc', 'yb'],
          },
          { code: 'futs', name: 'Upper Total', calc: ['ugt'] },
        ],
      },
      {
        name: 'Grand Total',
        code: 'grand-total',
        showHeader: false,
        totals: [{ code: 'fgt', name: 'Grand Total', calc: ['flts', 'futs'] }],
      },
    ],
  }), // end of methods
  created() {
    window.addEventListener('beforeunload', (event) => {
      // eslint-disable-next-line no-alert
      const message = 'Are you sure?';
      if (typeof event === 'undefined') {
        // eslint-disable-next-line no-param-reassign
        event = window.event;
      }
      if (event) {
        // eslint-disable-next-line no-param-reassign
        event.returnValue = message;
      }
      return message;
    });
  },
  mounted() {
    this.resetGame();

    EventBus.$on('modal-value-set', (score) => {
      // console.log('modal-value-set: score', score);
      this.updateScore(score);
      // playerIndex: this.playerIndex,
      // categoryCode: this.category.code,
      // value: selectedOption,
    });

    EventBus.$on('set-listen-mode-to-points', (info) => {
      // category: this.settings.category,
      this.listenForPoints(info.category);
    });

    EventBus.$on('cancel-score-modal', () => {
      // the ScoreModal.vue is listening too
      this.listenForPlayerCommands();
    });
  }, // end data
  methods: {
    focusOnNewPlayerAdd: function focusOnNewPlayerAdd() {
      this.newPlayerName = '';
      this.$nextTick(() => {
        this.$refs.newPlayer.focus();
      });
    },
    handleAddPlayer: function handleAddPlayer() {
      if (this.newPlayerName !== '') {
        this.addPlayer(this.newPlayerName);
        this.focusOnNewPlayerAdd();
      } else {
        this.startGame();
      }
    },
    handleRemovePlayer: function handleRemovePlayer(pix) {
      this.removePlayer(pix);
    },
    removePlayer: function removePlayer(pix) {
      if (!this.players.length) {
        return;
      }

      let playerIndexToRemove = pix;
      if (playerIndexToRemove === undefined) {
        // remove the last one
        playerIndexToRemove = this.players.length - 1;
      }
      soundService.playSound('explode');
      this.players.splice(playerIndexToRemove, 1);
      this.focusOnNewPlayerAdd();
    },
    updateZoom: function updateZoom(amount) {
      this.zoomScale += amount;
      document.getElementsByTagName(
        'body'
      )[0].style.transform = `'scale('${this.zoomScale})'`;
    },
    addPlayers: function addPlayers(names) {
      // console.log(names);
      // console.log(names.split(' '));
      // names = space seperated
      names.split(' ').forEach((name) => {
        if (name === '' || name === 'and') {
          return;
        }
        this.addPlayer(name);
      });
    },
    addPlayer: function addPlayer(name) {
      let cleanName = utils.toTitleCase(name);
      // special cases for the schmidt familly`
      switch (cleanName) {
        case 'Bunny':
        case 'Bonnie':
          cleanName = 'Bonny';
          break;
        case 'Maya':
          cleanName = 'Mya';
          break;
        case 'Dead':
          cleanName = 'Dad';
          break;
        case 'Ison':
          cleanName = 'Addison';
          break;
        default:
      }

      // if the player is already in the list
      if (this.players.some((player) => player.name === cleanName)) {
        soundService.playSound('invalid');
        return;
      }

      // eslint-disable-next-line
      const scores = {};

      // default scores
      // console.log('self.players');
      // console.log(self.players);
      // console.log('self.sections');
      // console.log(self.sections);
      this.sections.forEach((section) => {
        // console.log('section', section.name);
        if (section.categories) {
          section.categories.forEach((category) => {
            scores[category.code] = null;
          });
        }
        if (section.totals) {
          section.totals.forEach((total) => {
            scores[total.code] = 0;
          });
        }
      });

      // annyang.pause();
      // soundService.say(cleanName);
      // setTimeout(() => {
      //   annyang.resume();
      // }, 2000);
      soundService.playSound('add-player');

      this.players.push({
        name: cleanName,
        isCurrent: false,
        currentPosition: null,
        scores,
        final: 0,
      });
    },
    setCurrentPlayer: function setCurrentPlayer(pix) {
      this.players[pix].isCurrent = true;
      this.currentPlayerIndex = pix;
      soundService.sayWhosTurnItIs(this.players[pix].name);
      this.listenForPlayerCommands();
    },
    getCurrentPlayer: function getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    },
    invalidInput: function invalidInput() {
      soundService.playSound('invalid');
    },
    resetGame: function resetGame() {
      this.mode = 'add-players';
      this.round = 1;
      this.currentPlayerIndex = 0;
      this.players = [];
      this.focusOnNewPlayerAdd();
      this.listenForNames();
    },
    startGame: function startGame() {
      if (!this.players.length) {
        this.invalidInput();
        return;
      }
      soundService.playSound('dice-roll');
      soundService.playSound('slide-in');
      this.mode = 'playing';
      this.setCurrentPlayer(0);
    },
    endGame: function endGame() {
      this.mode = 'end';
      // janky settimeout... should use async/await
      soundService.playSound('game-over-strings');
      setTimeout(() => {
        soundService.playSound('and-the-winner-is');
        setTimeout(() => {
          soundService.say(this.getPlayersByScore()[0].name);
        }, 2000);
        setTimeout(() => {
          soundService.playSound('game-over-winner');
        }, 4000);
      }, 2000);
      this.listenForEndOfGame();
    },
    getPlayersByScore: function getPlayersByScore() {
      return this.players.slice().sort((a, b) => b.final - a.final);
    },
    updatePositions: function updatePositions() {
      const sorted = this.getPlayersByScore();

      function findWithAttr(array, attr, value) {
        for (let i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            return i;
          }
        }
        return -1;
      }

      // console.log('sorted', sorted);
      this.players.forEach((player, idx) => {
        this.players[idx].currentPosition =
          findWithAttr(sorted, 'final', this.players[idx].final) + 1;
      });
    },
    getPlacement: (player) => {
      switch (player.currentPosition) {
        case 1:
          return '1st';
        case 2:
          return '2nd';
        case 3:
          return '3rd';
        case 4:
          return '4th';
        case 5:
          return '5th';
        case 6:
          return '6th';
        case 7:
          return '7th';
        case 8:
          return '8th';
        default:
          return '';
      }
    },
    getScore: (player, category) => {
      if (player.scores && player.scores[category.code] != null) {
        return player.scores[category.code];
      }
      return null;
    },
    nextPlayer: function nextPlayer(currPlayerIndex) {
      this.players[currPlayerIndex].isCurrent = false;
      let nextPlayerIndex = currPlayerIndex + 1;
      if (nextPlayerIndex >= this.players.length) {
        nextPlayerIndex = 0;
        this.nextRound();
      }
      if (this.mode !== 'end') {
        this.setCurrentPlayer(nextPlayerIndex);
      }
    },
    nextRound: function nextRound() {
      this.updatePositions();
      this.round += 1;
      if (this.round > this.roundMax) {
        this.endGame();
      }
    },
    updatePlayerTotals: function updatePlayerTotals(playerIndex) {
      // console.log('updatePlayerTotals', playerIndex);
      this.sections.forEach((section) => {
        if (section.totals) {
          section.totals.forEach((total) => {
            this.updatePlayerTotal(playerIndex, total);
          });
        }
      });
    },
    updatePlayerTotal: function updatePlayerTotal(pix, total) {
      let val = 0;
      const player = this.players[pix];
      if (Array.isArray(total.calc)) {
        total.calc.forEach((scoreCode) => {
          val += player.scores[scoreCode] || 0;
        });

        // console.log('updatePlayerTotal', pix, total.code, total.calc, val);
        player.scores[total.code] = val;
        if (total.code === 'fgt') {
          player.final = val;
        }
        return;
      }
      if (total.calc === 'upper-bonus') {
        if (player.scores.uts >= 63) {
          player.scores[total.code] = 35;
          return;
        }
      }
      player.scores[total.code] = val;
    },
    updateScore(score) {
      const pix = score.playerIndex;

      if (score.value === null) {
        soundService.playSound('swipe');
      } else if (score.value === 0) {
        soundService.playSound(randomService.choice(['wah-wah', 'ooohh']));
      } else {
        soundService.playSound('confirm-score');
        if (score.categoryCode === 'yhtz' || score.categoryCode === 'yb') {
          soundService.playSound('yeah');
        }
      }

      const origScore = this.players[pix].scores[score.categoryCode];
      // set the score
      this.players[pix].scores[score.categoryCode] = score.value;
      this.updatePlayerTotals(pix);

      if (this.round > 1) {
        this.updatePositions();
      }

      if (
        !score.isOutOfOrderEntry &&
        origScore == null &&
        score.value != null
      ) {
        // next player
        this.nextPlayer(pix);
      } else {
        this.listenForPlayerCommands();
      }

      // console.log(score);
    },
    getPlayerCategories: function getPlayerCategories() {
      const categories = [];
      const { scores } = this.getCurrentPlayer();

      this.sections.forEach((section) => {
        // console.log('section', section.name);
        if (section.categories) {
          section.categories.forEach((category) => {
            categories.push({
              ...category,
              hasScore: scores[category.code] !== null,
              sectionCode: section.code,
            });
          });
        }
      });
      // console.log(categories);
      return categories;
    },
    getAvailableScoresForCurrentPlayer: function getAvailableScoresForCurrentPlayer() {
      let commands = [];

      const categories = this.getPlayerCategories();
      if (categories) {
        categories.forEach((category) => {
          if (category.listenFor && !category.hasScore) {
            commands = [...commands, ...category.listenFor];
          }
        });
      }

      if (commands) {
        // console.log(commands.join('|').toLowerCase());

        return commands.join('|').toLowerCase();
      }
      return '';
    },
    listenForNames: function listenForNames() {
      const self = this;
      annyang.addCommands({
        "add (to) (the) schmidt's": function addSpecial() {
          self.addPlayers('Ava Mya Addison Dad Mom');
        },
        'add (to) (the) schmidt family': function addSpecial() {
          self.addPlayers('Ava Mya Addison Dad Mom');
        },
        'add (the) ninja turtles': function addSpecial() {
          self.addPlayers('Leonardo Raphael Donatello Michelangelo');
        },
        'add (the) minions': function addSpecial() {
          self.addPlayers('Stewart Bob Kevin Mel');
        },
        'add (player) :name': this.addPlayer,
        'add (players) *name': this.addPlayers,
        'remove (the) (last) player': this.removePlayer,
        'start (the) game': this.startGame,
        'play (the) game': this.startGame,
        'play yahtzee': this.startGame,
      });

      annyang.addCallback('resultNoMatch', (event) => {
        clearTimeout(this.WhatWasHeardTimeout);
        this.whatWasHeard = `"${event.join('" <span class="or">or</span> "')}"`;
        // console.log('event', event);
        // console.log('event', this.whatWasHeard);
        this.WhatWasHeardTimeout = setTimeout(() => {
          this.whatWasHeard = null;
        }, 5000);
      });

      annyang.debug(true);
      annyang.start();
    },
    listenForPlayerCommands: function listenForPlayerCommands() {
      annyang.removeCommands();

      // build reg exp to listen, based on what is available
      const expression = `(${this.getAvailableScoresForCurrentPlayer()})`;
      // console.log(expression);

      annyang.addCommands({
        // 'enter score for :category': this.voiceCommandOpenScoreModal,
        'enter score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^enter score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'escort for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^escort for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'underscore for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^underscore for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'add score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^add score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'a score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^a score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'end score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^end score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'in score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^in score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
        'at score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(`^at score for ${expression}$`, 'i'),
          callback: this.voiceCommandOpenScoreModal,
        },
      });
    },
    listenForPoints: function listenForPoints(category) {
      annyang.removeCommands();

      if (category == null) {
        return;
      }

      const playerIndex = this.currentPlayerIndex;

      const pointOptions = categoryService.getPointOptions(category);
      const listenForOptions = pointOptions ? pointOptions.join('|') : '';

      // build reg exp to listen, based on what is available
      const expression = `^(${listenForOptions})$`;
      // console.log(expression);

      annyang.addCommands({
        // 'enter score for :category': this.voiceCommandOpenScoreModal,
        'cancel/back': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(/^(cancel|back)$/, 'i'),
          callback() {
            EventBus.$emit('cancel-score-modal');
          },
        },
        'enter points': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(expression, 'i'),
          callback: function setPoints(points) {
            EventBus.$emit('select-point-option', {
              category,
              playerIndex,
              points,
            });
          },
        },
        'clear score': function clearScore() {
          EventBus.$emit('select-point-option', {
            category,
            playerIndex,
            points: null,
          });
        },
      });
    },
    listenForEndOfGame: function listenForEndOfGame() {
      annyang.removeCommands();
      annyang.addCommands({
        'play (it) again': this.resetGame,
        'start (a) new game': this.resetGame,
        'new game': this.resetGame,
      });
    },
    voiceCommandOpenScoreModal: function voiceCommandOpenScoreModal(said) {
      // console.log('emit event for', said);
      const category = this.getCategoryByVoice(said);
      // console.log('category found', category);
      if (category !== null) {
        EventBus.$emit('click-score-input', {
          playerIndex: this.currentPlayerIndex,
          player: this.getCurrentPlayer(),
          category,
          value: null,
          type: 'category',
        });
      } else {
        this.invalidInput();
      }
      // console.log(category);
    },
    getCategoryByVoice: function getCategoryByVoice(said) {
      const saidClean = said.toLowerCase().trim();
      const categories = this.getPlayerCategories();
      if (categories) {
        for (let catIndex = 0; catIndex < categories.length; catIndex += 1) {
          const category = categories[catIndex];
          if (category.listenFor && !category.hasScore) {
            for (
              let listenIndex = 0;
              listenIndex < category.listenFor.length;
              listenIndex += 1
            ) {
              if (category.listenFor[listenIndex].toLowerCase() === saidClean) {
                return category;
              }
            }
          }
        }
      }
      return null;
    },
  },
  ready() {
    window.addEventListener('keypress', (event) => {
      // If down arrow was pressed...
      // console.log(event.keyCode, event.key);
      if (event.keyCode === 40) {
        this.updateZoom(-0.1);
        return false;
      }
      return true;
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
@import url('https://fonts.googleapis.com/css?family=Lexend+Deca&display=swap');

* {
  font-family: 'Lexend Deca';
  user-select: none;
}

h2 {
  font-size: 5vh;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #333;
}

@media only screen and (max-width: 700px) {
  body {
    overflow: auto;
  }
}

.add-players-container {
  color: white;
  padding: 40px;
  font-size: 7vh;
  max-width: 400px;
  margin: 15px auto;
}

.add-players-container input {
  font-size: 40px;
  width: 100%;
}

.btn-container {
  text-align: left;
}

.add-players-container button {
  font-size: 2.5vh;
  margin-right: 10px;
  padding: 10px 20px;
}

.add-players-container ol {
  text-align: left;
}

.add-players-container .player:hover {
  color: red;
  cursor: not-allowed;
}

.voice-help {
  text-align: left;
  color: #999;
  font-size: 23px;
}

.voice-help ul {
  list-style-type: none;
}

h3 {
  margin: 2px 4px;
  font-size: 26px;
}

.player h3 {
  color: darkblue;
  text-transform: uppercase;
}

.board {
  display: flex; /* or inline-flex */
  border-right: solid 1px black;
  height: 100%;
}

.board .col {
  flex-grow: 0; /* default 0 */
  background-color: #ccc;
  width: 230px;
  font-size: 20px;
  border: solid 1px black;
  border-right: 0;
}

.board .col.player {
  width: 160px;
}

.board .cell {
  height: 4.4vh;
  border-bottom: solid 1px black;
  display: grid;
  vertical-align: middle;
  /* padding: 2px; */
}
@media only screen and (max-height: 800px) {
  .board .cell {
    height: 30px;
  }
}

.board .header.cell {
  /* height: auto; */
}

.board .header h3 {
  font-size: 2.5vh;
}

.how {
  font-size: 1.5vh;
  font-style: italic;
  font-weight: normal;
  margin-top: -5px; /* janky */
}

@media only screen and (max-height: 800px) {
  .how {
    display: none;
  }
}

.col.label {
  flex-basis: auto;
}

.label {
  text-align: left;
}

.label .category,
.label .total {
  padding-left: 3px;
  font-size: 2.4vh;
}
.label .category {
  padding-left: 8px;
}

.player .category,
.player .total {
  color: #666;
}

.player.current .category,
.player.current .total {
  color: #000;
}

.cell.total {
  background-color: #aaa;
  /* font-size: 22px; */
  font-weight: bold;
}

.cell.upper-section {
  background-color: lightskyblue;
}

.cell.lower-section {
  background-color: salmon;
}

.cell.grand-total {
  background-color: limegreen;
  /* font-size: 34px; */
  text-transform: uppercase;
  font-weight: bold;
}

.current.col {
  background-color: #eee;
}

.current .cell.upper-section {
  background-color: #b4e0fc;
}

.current .cell.lower-section {
  background-color: lightsalmon;
}

.current .cell.grand-total {
  background-color: lightgreen;
}

/* .col.player.placement-1 .header.cell {
  background-image: url('../assets/placement-1.png');
}
.col.player.placement-2 .header.cell {
  background-image: url('../assets/placement-2.png');
}
.col.player.placement-3 .header.cell {
  background-image: url('../assets/placement-3.png');
}

.col.player .header.cell {
  background-repeat: no-repeat;
  background-position-x: 95%;
} */

.scoreboard {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  font-size: 2em;
  background: #eee;
  padding: 10px;
  height: 100vh;
}

@media only screen and (max-width: 700px) {
  .scoreboard {
    position: relative;
    top: 0;
    left: 0;
  }
}

.scoreboard .rounds {
  color: blue;
}

.scoreboard .roundsLeft {
  font-size: 0.8em;
  font-style: italic;
}

.scoreboard .leaderboard {
  margin-top: 60px;
  text-align: left;
  border-bottom: solid 1px black;
  width: 360px;
  margin: 0 auto;
  margin-bottom: 20px;
}

.leaderboard h4 {
  margin-bottom: 10px;
  text-align: center;
}

.leaderboard .item {
  border: solid 1px black;
  border-bottom: none;
  padding: 8px 10px;
  display: flex;
}

.leaderboard .placement {
  font-size: 1em;
  margin-right: 40px;
  min-width: 60px;
}

.leaderboard .name {
  flex-grow: 1;
}

.leaderboard .score {
  width: 100px;
  text-align: right;
}

.turn-info {
  background-color: lightgoldenrodyellow;
}

.turn-info h4 {
  margin: 0;
}

.turn-info .category {
  font-size: 0.8em;
  font-weight: bold;
  width: 50%;
  float: left;
}

.turn-info .used {
  text-decoration: line-through;
  font-weight: normal;
  color: #ccc;
}

.used.upper-section {
  color: #6ea9cc;
}

.used.lower-section {
  color: #cc685d;
}

.winner {
  margin-top: 20px;
  text-transform: uppercase;
  background: lightgreen;
  padding: 2px 0;
}

/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-up-fade-enter-active {
  transition: all 1.33s ease;
}
.slide-up-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-up-fade-enter, .slide-up-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(1000px);
  opacity: 0;
}

.slide-left-fade-enter-active {
  transition: all 1.33s ease;
}
.slide-left-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-left-fade-enter, .slide-left-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(400px);
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 3.5s;
}
.bounce-leave-active {
  animation: bounce-in 1.5s reverse;
}
.player-add-remove-enter-active {
  animation: bounce-in 0.5s;
}
.player-add-remove-leave-active {
  color: red;
  animation: letter_explode 0.9s 0s forwards;
  transition: 0.7s;
  opacity: 0;
  transform: scale(4) rotate(720deg);
  -moz-transform: scale(4) rotate(720deg);
  -webkit-transform: scale(4) rotate(720deg);
  -o-transform: scale(4) rotate(720deg);
}
@keyframes letter_explode {
  0% {
    letter-spacing: 0.1em;
  }
  100% {
    letter-spacing: 1em;
  }
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}

.tooltip {
  display: block !important;
  z-index: 10000;
}

.tooltip .tooltip-inner {
  opacity: 0.9;
  background: #666;
  color: #ccc;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip .tooltip-arrow {
  opacity: 0.9;
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: #666;
}

.tooltip[x-placement^='top'] {
  margin-bottom: 5px;
}

.tooltip[x-placement^='top'] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^='bottom'] {
  margin-top: 5px;
}

.tooltip[x-placement^='bottom'] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^='right'] {
  margin-left: 5px;
}

.tooltip[x-placement^='right'] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^='left'] {
  margin-right: 5px;
}

.tooltip[x-placement^='left'] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[aria-hidden='true'] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden='false'] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s;
}

.what-was-heard {
  font-family: Arial;
  width: 100%;
  color: purple;
  background: white;
  text-align: center;
  font-size: 3vh;
  z-index: 100;
  padding: 10px;
  position: fixed;
  border-radius: 20px;
  box-sizing: border-box;
}

.what-was-heard .or {
  color: #999;
  font-size: 2vh;
}

/* mobile */
@media only screen and (max-height: 800px) {
  .board .col {
    width: 170px;
  }

  .board .header h3 {
    font-size: 2.2vh;
  }
  .label .category,
  .label .total {
    font-size: 2.2vh;
  }
}

/* big fullscreen */
@media only screen and (min-height: 1000px) {
  .board .col {
    width: 270px;
  }
  .add-players-container button {
    font-size: 25px;
  }
  .current .needs {
    font-size: 20px;
  }
  .board .cell {
    height: 4.45vh;
  }
}
</style>
