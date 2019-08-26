<template>
  <div :style="{ transform: 'scale('+ zoomScale+')'}">
    <div class="board" v-for="section in sections" v-bind:key="section.name">
      <div class="col label">
        <div v-if="section.showHeader" :class="section.code" class="header cell">
          <h3>{{section.name}}</h3>
        </div>

        <div :class="section.code" class="cell category" v-for="category in section.categories" v-bind:key="category.code">
          <strong>{{category.name}}</strong>
          <div class="how">
            {{category.how}}
          </div>
        </div>

        <div :class="section.code" class="cell total" v-for="total in section.totals" v-bind:key="total.code">
          {{total.name}}
          <div class="how" v-if="total.how">
            {{total.how}}
          </div>
        </div>
      </div>

      <div :class="['placement-'+ player.currentPosition, (player.isCurrent) ? 'current' : '']" class="col player" v-bind:name="player.name" v-for="(player, pix) in players" v-bind:key="player.name">
        <div :class="section.code" v-if="section.showHeader" class="header cell">
          <h3 style="float:right">{{ player.name }}<span class="placement" v-html="getPlacement(player)"></span></h3>
        </div>

        <div class="cell category" v-for="category in section.categories" v-bind:key="category.code">
          <ScoreInput :category="category" type="category" :playerIndex="pix" :player="player" :value="getScore(player, category)" />
        </div>

        <div :class="section.code" class="cell total" v-for="total in section.totals" v-bind:key="total.code">
          <ScoreInput :category="total"  type="total" :value="player.scores[total.code] || 0" />
        </div>
      </div>
    </div> <!-- end board -->

    <div v-if="this.mode != 'add-players'" class="scorebaord">
      <div v-if="this.mode == 'playing'">
        <div class="rounds">Round <strong>{{round}}</strong> of {{roundMax}}</div>
        <div class="roundsLeft">{{1+roundMax-round}} plays left</div>
      </div>
      <div v-else>
        <div class="rounds">GAME OVER</div>
        <div class="winner">
          <h4>{{this.getPlayersByScore()[0].name}}<br/>IS THE WINNER</h4>
        </div>
      </div>

      <div class="leaderboard">
        <h4>Yahtzee Leaderboard</h4>
        <div :class="['placement-'+ player.currentPosition]" v-bind:name="player.name" v-for="(player) in this.getPlayersByScore()" v-bind:key="player.name">
          <div class="item">
            <div class="placement" v-html="getPlacement(player)"></div>
            <div class="name">{{ player.name }}</div>
            <div class="score">{{ player.final }}</div>
          </div>
        </div>
      </div>

      <div class="turn-info" v-if="this.mode !== 'end'">
        <h4>{{this.players[currenmtPlayerIndex].name}}'s Turn</h4>
        <div v-for="section in sections" v-bind:key="section.name">
          <div v-for="category in section.categories" v-bind:key="category.code">
            <div :class="[section.code, { used: getScore(players[currenmtPlayerIndex], category) !== null }]" class="cell category">{{category.name}}</div>
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
 - git repo
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
 - make the score input
 - smart sizing, use the whole screen (height and width) TOUGH
*/
import { EventBus } from '../event-bus';
import ScoreInput from './ScoreInput.vue';

export default {
  name: 'Board',
  components: {
    ScoreInput,
  },
  data: () => (
    {
      zoomScale: 1,
      mode: 'add-players',
      round: 1,
      roundMax: 13,
      currenmtPlayerIndex: 0,
      players: [],
      sections: [
        {
          name: 'Upper Section',
          code: 'upper-section',
          showHeader: true,
          categories: [
            { code: '1s', name: 'Aces', how: 'Count and add only Aces', type: 'upper', options: [1, 2, 3, 4, 5] },
            { code: '2s', name: 'Twos', how: 'Count and add only Twos', type: 'upper', options: [2, 4, 6, 8, 10] },
            { code: '3s', name: 'Threes', how: 'Count and add only Threes', type: 'upper', options: [3, 6, 9, 12, 15] },
            { code: '4s', name: 'Fours', how: 'Count and add only Fours', type: 'upper', options: [4, 8, 12, 16, 20] },
            { code: '5s', name: 'Fives', how: 'Count and add only Fives', type: 'upper', options: [5, 10, 15, 20, 25] },
            { code: '6s', name: 'Sixes', how: 'Count and add only Sixes', type: 'upper', options: [6, 12, 18, 24, 30] },
          ],
          totals: [
            { code: 'uts', name: 'Total', calc: ['1s', '2s', '3s', '4s', '5s', '6s'] },
            {
              code: 'bonus',
              name: 'Bonus',
              how: 'If total score is 63 or higher. +35',
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
            { code: '3oak', name: '3 of a Kind', how: 'Add total of all dice', options: null },
            { code: '4oak', name: '4 of a Kind', how: 'Add total of all dice', options: null },
            { code: 'fh', name: 'Full House', how: 'Score 25', type: 'on-off', options: [25] },
            { code: 'smst', name: 'Sm Straight', how: 'Score 30', type: 'on-off', options: [30] },
            { code: 'lgst', name: 'Lg Straight', how: 'Score 40', type: 'on-off', options: [40] },
            { code: 'yhtz', name: 'Yahtzee', how: 'Score 50', type: 'on-off', options: [50] },
            { code: 'chnc', name: 'Chance', how: 'Add total of all dice', options: null },
            { code: 'yb', name: 'Yahtzee Bonus', how: 'Score 100 per', type: 'yahtzee-bonus', options: [100, 200, 300, 400] },
          ],
          totals: [
            { code: 'flts', name: 'Lower Section Total', calc: ['3oak', '4oak', 'fh', 'smst', 'lgst', 'yhtz', 'chnc', 'yb'] },
            { code: 'futs', name: 'Upper Section Total', calc: ['uts'] },
          ],
        },
        {
          name: 'Grand Total',
          code: 'grand-total',
          showHeader: false,
          totals: [
            { code: 'fgt', name: 'Grand Total', calc: ['flts', 'futs'] },
          ],
        },
      ],
    }
  ), // end data
  methods: {
    updateZoom: function updateZoom(amount) {
      this.zoomScale += amount;
      document.getElementsByTagName('body')[0].style.transform = `'scale('${this.zoomScale})'`;
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

      this.players.push({
        name,
        isCurrent: false,
        currentPosition: null,
        scores,
        final: 0,
      });
    },
    setCurrentPlayer: function setCurrentPlayer(pix) {
      this.players[pix].isCurrent = true;
      this.currenmtPlayerIndex = pix;
    },
    startGame: function startGame() {
      this.mode = 'playing';
      this.setCurrentPlayer(0);
    },
    endGame: function endGame() {
      this.mode = 'end';
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
        case 1: return '1st';
        case 2: return '2nd';
        case 3: return '3rd';
        case 4: return '4th';
        case 5: return '5th';
        case 6: return '6th';
        case 7: return '7th';
        case 8: return '8th';
        default: return '';
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

      // if it is the end of the round
      this.updatePositions();

      if (!score.isOutOfOrderEntry && score.value != null) {
        // next player
        this.nextPlayer(pix);
      }

      // console.log(score);
    },
  }, // end of methods
  mounted() {
    // test data
    this.addPlayer('Ava');
    this.addPlayer('Mya');
    this.addPlayer('Addison');
    this.addPlayer('Mom');
    this.addPlayer('Dad');
    // this.players[0].scores['1s'] = 3;
    // this.players[1].scores['4oak'] = 29;
    // this.players[2].scores['1s'] = 3;
    // this.players[3].scores['1s'] = 3;
    // this.players[4].scores['1s'] = 3;
    this.startGame();

    EventBus.$on('modal-value-set', (score) => {
      console.log('modal-value-set: score', score);
      this.updateScore(score);
      // playerIndex: this.playerIndex,
      // categoryCode: this.category.code,
      // value: selectedOption,
    });
  },
  ready() {
    window.addEventListener('keypress', function keyUp(event) {
      // If down arrow was pressed...
      console.log(event.keyCode, event.key);
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

body {
  margin: 0;
  padding: 0;
  overflow: auto;
  background-color: #333;
}

h3 {
  margin: 2px 4px;
  font-size:26px;
}

.player h3 {
  color: darkblue;
  text-transform: uppercase;
}

.board {
  display: flex; /* or inline-flex */
  border-right:solid 1px black;
  height:100%;
}

.board .col {
  flex-grow:0; /* default 0 */
  background-color:#ccc;
  width:280px;
  font-size:20px;
  border:solid 1px black;
  border-right: 0;
}

.board .col.player {
  width:210px;
}

.board .cell {
  height:44.5px;
  border-bottom: solid 1px black;
  display: grid;
  vertical-align: middle;
  padding:2px;
}

.board .header.cell {
  height:auto;
}

.how {
  font-size:.8em;
  font-style: italic;
  font-weight: normal;
  margin-top: -5px; /* janky */
}

.col.label {
  flex-basis:auto;
}


.label {
  text-align:left;
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
  font-weight:bold;
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
  font-weight:bold;
}

.current.col {
  background-color: #eee;
}

.current .cell.upper-section {
  background-color: #B4E0FC;
}

.current .cell.lower-section {
  background-color: lightsalmon;
}

.current .cell.grand-total {
  background-color: lightgreen;
}

.placement {
  float: right;
  display:inline-block;
  color: #000;
  font-size: .8em;
  margin-right:14px;
  margin-top:6  px;
}

.col.player.placement-1 .header.cell {
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
}

.scorebaord {
  position: absolute;
  top:0;
  right: 0;
  width:400px;
  font-size:2em;
  background: #eee;
  padding: 10px;
}

.scorebaord .rounds {
  color: blue;
}

.scorebaord .roundsLeft {
  font-size: .8em;
  font-style: italic;
}

.scorebaord .leaderboard {
  margin-top:60px;
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
  flex-grow:1;
}

.leaderboard .score {
  width:100px;
  text-align:right;
}

.turn-info {
  background-color: lightgoldenrodyellow;
}

.turn-info h4 {
  margin:0;
}

.turn-info .category {
  font-size:.9em;
  font-weight: bold;
}

.turn-info .used {
  text-decoration: line-through;
  font-size: .6em;
  font-weight: normal;
}

.winner {
    margin-top:20px;
    text-transform: uppercase;
    background: lightgreen;
    padding: 2px 0;
}
</style>
