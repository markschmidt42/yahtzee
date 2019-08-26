<template>
  <div class='modal-input'>
    <h4>Please enter the <strong>{{category.name}}</strong><br/>score for <strong>{{player.name}}</strong></h4>

    <div class="options">
      <div :class="{full: option === 0 || options.length <= 2}" v-for="option in options" v-bind:key="option" @click="handleClick(option)">
        <div class="option">{{option}}</div>
      </div>
      <div class="full" v-if="value !== null" @click="handleClick(null)">
        <div class="option">Clear Score ({{value}})</div>
      </div>
    </div>

  </div>
</template>

<script>
import { EventBus } from '../event-bus';

export default {
  name: 'ScoreModal',
  props: ['value', 'options', 'playerIndex', 'player', 'category', 'isOutOfOrderEntry'],
  methods: {
    handleClick: function handleClick(selectedOption) {
      EventBus.$emit('modal-value-set', {
        playerIndex: this.playerIndex,
        categoryCode: this.category.code,
        isOutOfOrderEntry: this.isOutOfOrderEntry,
        value: selectedOption,
      });

      this.$modal.hide('input-modal');
    },
  },
};
</script>

<style scoped>
.modal-input {
  background-color:black;
  color:white;
  padding:20px 20px;
}

h4 {
  text-align:center;
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: normal;
}

h4 strong {
  color: #2dabf9;
}

div {
  font-size: 40px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  width:740px;
  justify-content: center;
  /* justify-content: space-between; */
}

.option {
  display: inline-block;
  margin: 8px;
  text-align: center;
  flex: 1;
  min-width: 70px;

  background:-webkit-gradient(linear, left top, left bottom, color-stop(0.05, #2dabf9), color-stop(1, #0688fa));
  background:-moz-linear-gradient(top, #2dabf9 5%, #0688fa 100%);
  background:-webkit-linear-gradient(top, #2dabf9 5%, #0688fa 100%);
  background:-o-linear-gradient(top, #2dabf9 5%, #0688fa 100%);
  background:-ms-linear-gradient(top, #2dabf9 5%, #0688fa 100%);
  background:linear-gradient(to bottom, #2dabf9 5%, #0688fa 100%);
  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#2dabf9', endColorstr='#0688fa',GradientType=0);
  background-color:#2dabf9;
  -moz-border-radius:14px;
  -webkit-border-radius:14px;
  border-radius:14px;
  border:1px solid #0b0e07;
  display:inline-block;
  cursor:pointer;
  color:#ffffff;
  padding:18px 30px;
  text-decoration:none;
  text-shadow:0px 1px 8px #263666;
}
.option:hover {
  background:-webkit-gradient(linear, left top, left bottom, color-stop(0.05, #ffd324), color-stop(1, #ffec64));
  background:-moz-linear-gradient(top, #ffd324 5%, #ffec64 100%);
  background:-webkit-linear-gradient(top, #ffd324 5%, #ffec64 100%);
  background:-o-linear-gradient(top, #ffd324 5%, #ffec64 100%);
  background:-ms-linear-gradient(top, #ffd324 5%, #ffec64 100%);
  background:linear-gradient(to bottom, #ffd324 5%, #ffec64 100%);
  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffd324', endColorstr='#ffec64',GradientType=0);
  background-color:#ffd324;
}
.option:active {
  position:relative;
  top:1px;
}

.full {
  width: 100%;
  display: flex;
}

</style>
