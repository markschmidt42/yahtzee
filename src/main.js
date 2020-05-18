import Vue from 'vue';
import VTooltip from 'v-tooltip';
import VModal from 'vue-js-modal';
import LongPress from 'vue-directive-long-press';
import App from './App.vue';

Vue.use(VTooltip);
Vue.use(VModal, {
  dynamic: true,
  injectModalsContainer: true,
  dynamicDefaults: { clickToClose: false, dialog: true },
});
Vue.directive('long-press', LongPress);
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
