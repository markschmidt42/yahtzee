<template>
    <div
      :class="[category.type, { active: hover }, { needs: (value == null) }, { used: (value != null) }]"
      class="input"
      type="text"
      code:="this.category.code"
      @mouseover="hover = true"
      @mouseleave="hover = false"
      @click="handleOnClick()"
      @dblclick="handleOnDblClick()"
      >
        {{value}}
    </div>
</template>

<script>
// move to utility
const choice = items => items[Math.floor(Math.random() * items.length)];

export default {
  name: 'ScoreInput',
  props: ['playerIndex', 'player', 'category', 'value'],
  data: () => (
    {
      hover: false,
    }
  ),
  methods: {
    isOutOfOrderEntry: function isOutOfOrderEntry() { return !this.player.isCurrent || this.value != null; },
    handleOnClick: function handleOnClick() {
      if (this.isOutOfOrderEntry()) {
        // retrun/cancel event
        return false;
      }
      this.saveScore();
      return true;
    },
    handleOnDblClick: function handleOnDblClick() {
      if (!this.isOutOfOrderEntry()) {
        // retrun/cancel event
        return false;
      }
      this.saveScore();
      return true;
    },
    getPossibleScores: function getPossibleScores() {
      // return array of possible values
      let ops = []; // 0 is always an option
      if (this.category.options) {
        ops = [...ops, ...this.category.options];
      } else {
        // 5 thru 29
        const arr5thru29 = Array.from(Array(30 - 5), (_, x) => x + 5);
        ops = [...ops, ...arr5thru29];
      }
      ops.push(0);
      console.log(ops);
      return ops;
    },
    saveScore: function saveScore() {
      const ops = this.getPossibleScores();
      let newValue = choice(ops);
      console.log('newValue', newValue);
      if (this.value != null) {
        newValue = null; // undo it
      }
      this.$emit('update-score', {
        playerIndex: this.playerIndex,
        categoryCode: this.category.code,
        value: newValue,
        isOutOfOrderEntry: this.isOutOfOrderEntry(),
      });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    .input {
        font-size:30px;
        text-align:center;
        background-color: inherit;
        display: table-cell;
        vertical-align: middle;
    }

    .current .used {
      background-color: #aaa;
    }

    .total .used {
      background-color: unset;
    }

    .current .needs.active {
      cursor: pointer;
      background: yellow;
    }

    .total.active {
      background: unset;
    }

    .input.total {
      background: unset;
      cursor: default;
    }

</style>
