import '../sass/style.scss';

import { $, $$ } from './modules/bling';

import axios from 'axios'


if ($('#v-refine-products')) {


    const app = new Vue({
      el: '#v-refine-products',
      data: {
        keyword: '',
        items: []
      },
      created() {
        axios.get(`/api/v1/search${window.location.search}`).then(res => {
            this.items = res.data
        });
      },
      computed: {
        filteredList() {
            return this.items.filter((product) => {
                return product.slug.includes(this.keyword.toLowerCase());
            })
        }
      }
    });

}