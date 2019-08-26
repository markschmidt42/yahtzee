import Vue from 'vue';
import VModal from 'vue-js-modal';
import App from './App.vue';

Vue.use(VModal, { dynamic: true, injectModalsContainer: true, dynamicDefaults: { clickToClose: false, dialog: true } });

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
