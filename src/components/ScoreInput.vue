<template>
  <div
    v-if="loaded"
    v-tooltip.bottom="(value === null && !isOutOfOrderEntry()) ? `Say &quot;Enter score for ${settings.category.name}&quot;` : ''"
    v-long-press="500"
    :class="[settings.class, settings.category.type, { active: hover }, { needs: (value == null) }, { used: (value != null) }]"
    class="input"
    type="text"
    code:="this.settings.category.code"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    @click="handleOnClick()"
    @dblclick="handleOnDblClick()"
    @long-press-start="handleOnDblClick()"
  >
    {{ value == null && settings.player.isCurrent ? settings.category.name : value }}
  </div>
</template>

<script>
// services
import { EventBus } from '../event-bus';
import categoryService from '../services/category.service';
import soundService from '../services/sound.service';

// components
import ScoreModal from './ScoreModal.vue';

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
        class: null,
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
      if (this.settings.type === 'total' || this.isOutOfOrderEntry() || this.value !== null) {
        // retrun/cancel event
        return false;
      }
      this.openModal();
      // this.saveScore();
      return true;
    },
    handleOnDblClick: function handleOnDblClick() {
      if (this.settings.type === 'total' || (!this.isOutOfOrderEntry() && this.value === null)) {
        // retrun/cancel event
        return false;
      }
      this.openModal();
      // this.saveScore();
      return true;
    },
    openModal: function openModal() {
      soundService.playSound('quick-pop');

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
        width: '95%',
        height: 'auto',
        // draggable: false fixes the mobile clicking issue
        draggable: false,
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

      if (newValue !== null) {
        this.settings.class = 'saved';
      }
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
    .v--modal-overlay .v--modal-box {
      border-radius: 20px;
    }
    .input {
        /* font-size:30px; */
        font-size:3.5vh;
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
      color: #0688fa;
      font-size:1.65vh;
      padding-top: 1.1vh;
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

    .category .used {
      animation: light-up 1s ease-in;
    }
    @keyframes light-up {
      from {
        background-color: green;
        color:white;
        transform: scale(5);
      }
      to {
        transform: scale(1);
      }
    }

    @media only screen and (max-height: 800px) {
      .input {
        font-size:24px;
      }

      .current .needs {
        padding-top: 0.8vh;
      }
    }

</style>
