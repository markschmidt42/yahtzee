<template>
  <div :style="{ transform: 'scale('+ zoomScale+')'}">
    <div v-if="mode == 'add-players'" class="add-players-container">
      <h2>Add Players:</h2>
      <input ref="newPlayer" v-model="newPlayerName" type="text" maxlength="8" @keyup.enter="handleAddPlayer">
      <button href="#" @click="handleAddPlayer">Add Players</button>
      <button v-if="players.length > 0" href="#" @click="startGame">Start Game</button>

      <ol>
        <li v-for="(player, pix) in players" :key="player.name" class="player" :name="player.name" @click="handleRemovePlayer(pix)">
          {{ player.name }}
        </li>
      </ol>
    </div>
    <div v-if="mode != 'add-players'">
      <div v-for="section in sections" :key="section.name" class="board">
        <div class="col label">
          <div v-if="section.showHeader" :class="section.code" class="header cell">
            <h3>{{ section.name }}</h3>
          </div>

          <div v-for="category in section.categories" :key="category.code" :class="section.code" class="cell category">
            <strong>{{ category.name }}</strong>
            <div class="how">
              {{ category.how }}
            </div>
          </div>

          <div v-for="total in section.totals" :key="total.code" :class="section.code" class="cell total">
            {{ total.name }}
            <div v-if="total.how" class="how">
              {{ total.how }}
            </div>
          </div>
        </div>

        <div v-for="(player, pix) in players" :key="player.name" :class="[(player.isCurrent) ? 'current' : '']" class="col player" :name="player.name">
          <div v-if="section.showHeader" :class="section.code" class="header cell">
            <h3>{{ player.name }}</h3>
          </div>

          <div v-for="category in section.categories" :key="category.code" class="cell category">
            <ScoreInput :category="category" type="category" :player-index="pix" :player="player" :value="getScore(player, category)" />
          </div>

          <div v-for="total in section.totals" :key="total.code" :class="section.code" class="cell total">
            <ScoreInput :category="total" type="total" :value="player.scores[total.code] || 0" />
          </div>
        </div>
      </div>
      <!-- end board -->
    </div>

    <div
      v-if="mode != 'add-players'"
      class="scorebaord"
    >
      <div v-if="mode == 'playing'">
        <div class="rounds">Round <strong>{{ round }}</strong> of {{ roundMax }}</div>
        <div class="roundsLeft">{{ 1+roundMax-round }} play{{ 1+roundMax-round != 1 ? 's' : '' }} left</div>
      </div>
      <div v-else>
        <div class="rounds">
          GAME OVER
        </div>
        <div class="winner">
          <h4>{{ getPlayersByScore()[0].name }}<br>IS THE WINNER</h4>
        </div>
      </div>

      <div class="leaderboard">
        <h4>Yahtzee Leaderboard</h4>
        <div
          v-for="(player) in getPlayersByScore()"
          :key="player.name"
          :class="['placement-'+ player.currentPosition]"
          :name="player.name"
        >
          <div class="item">
            <div class="placement" v-html="getPlacement(player)" />
            <div class="name">
              {{ player.name }}
            </div>
            <div class="score">
              {{ player.final }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="mode !== 'end'" class="turn-info">
        <h4>{{ players[currentPlayerIndex].name }}'s Turn</h4>
        <div v-for="category in getPlayerCategories()" :key="category.code">
          <div :class="[category.sectionCode, { used: category.hasScore }]" class="cell category">
            {{ category.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- one modal -->
    <modal name="hello-world">
      hello, world!
    </modal>
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
*/

// third-party
import annyang from 'annyang';

// services
import { EventBus } from '../event-bus';
import categoryService from '../services/category.service';

// components
import ScoreInput from './ScoreInput.vue';

const utils = {
  // eslint-disable-next-line
  toTitleCase: str => {
    // eslint-disable-next-line
    return str.replace(
      /\w\S*/g,
      // eslint-disable-next-line
      function(txt) {
        // eslint-disable-next-line
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      },
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
            listenFor: ['one', 'ones', 'aces'],
          },
          {
            code: '2s',
            name: 'Twos',
            how: 'Count and add only Twos',
            type: 'upper',
            options: [2, 4, 6, 8],
            listenFor: ['two', 'twos'],
          },
          {
            code: '3s',
            name: 'Threes',
            how: 'Count and add only Threes',
            type: 'upper',
            options: [3, 6, 9, 12],
            listenFor: ['three', 'threes'],
          },
          {
            code: '4s',
            name: 'Fours',
            how: 'Count and add only Fours',
            type: 'upper',
            options: [4, 8, 12, 16],
            listenFor: ['four', 'fours'],
          },
          {
            code: '5s',
            name: 'Fives',
            how: 'Count and add only Fives',
            type: 'upper',
            options: [5, 10, 15, 20],
            listenFor: ['five', 'fives'],
          },
          {
            code: '6s',
            name: 'Sixes',
            how: 'Count and add only Sixes',
            type: 'upper',
            options: [6, 12, 18, 24],
            listenFor: ['six', 'sixes'],
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
          { code: 'ugt', name: 'Upper Section Total', calc: ['uts', 'bonus'] },
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
            listenFor: ['small straight', 'small strait'],
          },
          {
            code: 'lgst',
            name: 'Lg Straight',
            how: 'Score 40',
            type: 'on-off',
            options: [40],
            listenFor: ['large straight', 'large strait'],
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
            listenFor: ['chance'],
          },
          {
            code: 'yb',
            name: 'Yahtzee Bonus',
            how: 'Score 100 per',
            type: 'yahtzee-bonus',
            options: [100, 200, 300, 400],
            listenFor: ['yahtzee bonus', 'yacht zee bonus', 'yacht Z bonus', 'yats zee bonus'],
          },
        ],
        totals: [
          {
            code: 'flts',
            name: 'Lower Section Total',
            calc: ['3oak', '4oak', 'fh', 'smst', 'lgst', 'yhtz', 'chnc', 'yb'],
          },
          { code: 'futs', name: 'Upper Section Total', calc: ['ugt'] },
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
      this.players.splice(pix, 1);
      this.focusOnNewPlayerAdd();
    },
    updateZoom: function updateZoom(amount) {
      this.zoomScale += amount;
      document.getElementsByTagName(
        'body',
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

      this.listenForPlayerCommands();
    },
    getCurrentPlayer: function getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
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
      this.mode = 'playing';
      this.setCurrentPlayer(0);
    },
    endGame: function endGame() {
      this.mode = 'end';
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
        this.players[idx].currentPosition = findWithAttr(sorted, 'final', this.players[idx].final) + 1;
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
      // set the score
      this.players[pix].scores[score.categoryCode] = score.value;
      this.updatePlayerTotals(pix);

      if (this.round > 1) {
        this.updatePositions();
      }

      if (!score.isOutOfOrderEntry && score.value != null) {
        // next player
        this.nextPlayer(pix);
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
      annyang.addCommands({
        'add (player) :name': this.addPlayer,
        'add (players) *name': this.addPlayers,
        'start (the) game': this.startGame,
        'play (the) game': this.startGame,
        'play yahtzee': this.startGame,
      });

      annyang.start();
    },
    listenForPlayerCommands: function listenForPlayerCommands() {
      annyang.removeCommands();

      // build reg exp to listen, based on what is available
      const expression = `^enter score for (${this.getAvailableScoresForCurrentPlayer()})$`;
      // console.log(expression);

      annyang.addCommands({
        // 'enter score for :category': this.voiceCommandOpenScoreModal,
        'enter score for category': {
          // regexp: /^enter score for (ones|aces|twos|threes|fours|fives|sixes)$/,
          regexp: new RegExp(expression, 'i'),
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
      const listenForOptions = (pointOptions) ? pointOptions.join('|') : '';

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
      if (category != null) {
        EventBus.$emit('click-score-input', {
          playerIndex: this.currentPlayerIndex,
          player: this.getCurrentPlayer(),
          category,
          value: null,
          type: 'category',
        });
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
            for (let listenIndex = 0; listenIndex < category.listenFor.length; listenIndex += 1) {
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
    window.addEventListener('keypress', function keyUp(event) {
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
@import url("https://fonts.googleapis.com/css?family=Lexend+Deca&display=swap");

* {
  font-family: "Lexend Deca";
  user-select: none;
}

body {
  margin: 0;
  padding: 0;
  overflow: auto;
  background-color: #333;
}

.add-players-container {
  color: white;
  padding: 40px;
  font-size: 40px;
  max-width: 400px;
  margin: 15px auto;
}

.add-players-container input {
  font-size: 40px;
  width: 100%;
}

.add-players-container button {
  font-size: 23px;
  margin: 10px 0;
  padding: 10px 20px;
}

.add-players-container button:last-of-type {
  margin-left: 10px;
}

.add-players-container ol {
  text-align: left;
}

.add-players-container .player:hover {
  color: red;
  cursor: not-allowed;
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
  width: 280px;
  font-size: 20px;
  border: solid 1px black;
  border-right: 0;
}

.board .col.player {
  width: 160px;
}

.board .cell {
  height: 44.5px;
  border-bottom: solid 1px black;
  display: grid;
  vertical-align: middle;
  padding: 2px;
}

.board .header.cell {
  height: auto;
}

.how {
  font-size: 0.8em;
  font-style: italic;
  font-weight: normal;
  margin-top: -5px; /* janky */
}

.col.label {
  flex-basis: auto;
}

.label {
  text-align: left;
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
  font-size: 22px;
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
  font-size: 34px;
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

.scorebaord {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  font-size: 2em;
  background: #eee;
  padding: 10px;
}

.scorebaord .rounds {
  color: blue;
}

.scorebaord .roundsLeft {
  font-size: 0.8em;
  font-style: italic;
}

.scorebaord .leaderboard {
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
  font-size: 0.9em;
  font-weight: bold;
}

.turn-info .used {
  text-decoration: line-through;
  font-size: 0.6em;
  font-weight: normal;
}

.winner {
  margin-top: 20px;
  text-transform: uppercase;
  background: lightgreen;
  padding: 2px 0;
}
</style>
