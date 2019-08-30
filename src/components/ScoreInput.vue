<template>
  <div
    v-if="loaded"
    :class="[settings.category.type, { active: hover }, { needs: (value == null) }, { used: (value != null) }]"
    class="input"
    type="text"
    code:="this.settings.category.code"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    @click="handleOnClick()"
    @dblclick="handleOnDblClick()"
  >
    {{ value == null && settings.player.isCurrent ? settings.category.name : value }}
  </div>
</template>

<script>
// services
import { EventBus } from '../event-bus';
import categoryService from '../services/category.service';

// components
import ScoreModal from './ScoreModal.vue';

// move to utility
// const choice = items => items[Math.floor(Math.random() * items.length)];

export default {
  name: 'ScoreInput',
  components: {
    // eslint-disable-next-line
    ScoreModal,
  },
  props: {
    playerIndex: Number,
    player: Object,
    category: Object,
    value: Number,
    type: String,
  },
  data: () => (
    {
      loaded: false,
      hover: false,
      settings: {
        playerIndex: null,
        player: null,
        category: null,
        // value: null,
        type: null,
      },
    }
  ),
  mounted() {
    // onload, copy props to data
    this.settings.playerIndex = this.playerIndex;
    this.settings.player = this.player;
    this.settings.category = this.category;
    // this.settings.value = this.value;
    this.settings.type = this.type;
    this.loaded = true;

    EventBus.$on('click-score-input', (info) => {
      // playerIndex: this.currentPlayerIndex,
      // player: this.players[this.currentPlayerIndex],
      // category,
      // value: null,
      // type: 'category',
      if (info.category.code !== this.settings.category.code) {
        return;
      }
      if (info.playerIndex !== this.settings.playerIndex) {
        return;
      }

      // copy values from emit event, to the props
      this.settings.playerIndex = info.playerIndex;
      this.settings.player = info.player;
      this.settings.category = info.category;
      this.value = info.value;
      this.settings.type = info.type;

      this.openModal();

      console.log('click-score-input', info);
    });
  },
  methods: {
    isOutOfOrderEntry: function isOutOfOrderEntry() { return !this.settings.player.isCurrent || this.settings.value != null; },
    handleOnClick: function handleOnClick() {
      if (this.settings.type === 'total' || this.isOutOfOrderEntry()) {
        // retrun/cancel event
        return false;
      }
      this.openModal();
      // this.saveScore();
      return true;
    },
    handleOnDblClick: function handleOnDblClick() {
      if (this.settings.type === 'total' || !this.isOutOfOrderEntry()) {
        // retrun/cancel event
        return false;
      }
      this.openModal();
      // this.saveScore();
      return true;
    },
    openModal: function openModal() {
      EventBus.$emit('set-listen-mode-to-points', {
        category: this.settings.category,
      });
      this.$modal.show(ScoreModal, {
        options: categoryService.getPointOptions(this.settings.category),
        player: this.settings.player,
        playerIndex: this.settings.playerIndex,
        category: this.settings.category,
        value: this.value,
        isOutOfOrderEntry: this.isOutOfOrderEntry(),
      },
      {
        name: 'input-modal',
        width: 780,
        height: 'auto',
        draggable: true,
      });
      // {
      //   'before-close': (event) => { console.log('this will be called before the modal closes', event); },
      // }
    },
    // modalValueSet: function modalValueSet(value) {
    //   console.log('value', value);
    // },
    saveScore: function saveScore(newValue) {
      // const ops = this.getPossibleScores();
      // let newValue = choice(ops);
      // console.log('newValue', newValue);
      // if (this.value != null) {
      //   newValue = null; // undo it
      // }
      this.$emit('update-score', {
        playerIndex: this.settings.playerIndex,
        categoryCode: this.settings.category.code,
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

    .current .needs {
      color: #aaa;
      font-size:.8em;
      padding: 12px 0;
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
